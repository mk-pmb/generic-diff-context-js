/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

module.exports = (function () {
  var gdc, genDiff = require('generic-diff'), addHiddenProp;

  addHiddenProp = (function () {
    var odp = Object.defineProperty;
    function defProp(obj, prop, val) {
      odp(obj, prop, { configurable: true, writable: true, value: val });
    }
    function setProp(obj, prop, val) { obj[prop] = val; }
    return (odp ? defProp : setProp);
  }());

  function truthyOr(x, y) { return (x || (x === y)); }
  function isEmpty(x) { return ((x === null) || (x === undefined)); }
  function isStr(x) { return ((typeof x) === 'string'); }
  function tryJoin(glue, x) { return (x.join ? x.join(glue) : x); }

  gdc = function genericDiffContext(a, b, opt) {
    opt = (opt || false);
    var fullMerge = [];
    if (opt.glue === undefined) {
      fullMerge.glue = (isStr(a) && isStr(b) && '');
    } else {
      fullMerge.glue = (opt.glue === '' ? '' : (opt.glue || false));
    }
    switch (b && typeof b) {
    case '':
    case 'string':
      a = genDiff(a, b);
      break;
    case 'object':
      if (opt || Array.isArray(b)) {
        a = genDiff(a, b);
      } else {
        opt = b;
        b = false;
      }
      break;
    }
    fullMerge.lenA = fullMerge.lenB = 0;
    a.forEach(gdc.scanPart.bind(null, fullMerge));
    if (opt.mergePairs) {
      fullMerge = gdc.mergeChangePairs(fullMerge, opt);
    }
    if (truthyOr(opt.unified, 0)) {
      return gdc.unify(fullMerge, (+opt.unified || 0), opt);
    }
    return fullMerge;
  };


  gdc.upgradePart = function (part, partIdx, fm) {
    if (!part.sign) {
      part.sign = (part.added ? (part.removed ? '±' : '+')
                              : (part.removed ? '-' : ' '));
    }
    if ((part.itemsA === undefined) || (part.itemsB === undefined)) {
      if (part.sign === '±') {
        throw new Error('Cannot find items for combined add/remove part #' +
          partIdx + ' (after items #' + fm.lenA + ' / ' + fm.lenB + ')');
      }
      if (part.itemsA === undefined) {
        part.itemsA = (part.added ? [] : part.items);
      }
      if (part.itemsB === undefined) {
        part.itemsB = (part.removed ? [] : part.items);
      }
      delete part.items;
    }
    return part;
  };


  gdc.scanPart = function (fm, part, partIdx) {
    var prev = (fm[fm.length - 1] || false);
    part = gdc.upgradePart(Object.assign({}, part), partIdx, fm);
    if (truthyOr(fm.glue, '')) {
      part.itemsA = tryJoin(fm.glue, part.itemsA);
      part.itemsB = tryJoin(fm.glue, part.itemsB);
    }
    part.startA = fm.lenA;
    part.startB = fm.lenB;
    fm.lenA += part.itemsA.length;
    fm.lenB += part.itemsB.length;
    if (part.sign === prev.sign) {
      gdc.addItemsToPrevPart(prev, part, fm.glue);
      return;
    }
    part.endA = fm.lenA;
    part.endB = fm.lenB;
    fm.push(part);
  };


  gdc.addItemsToPrevPart = function (prev, part, glue) {
    if (truthyOr(glue, '')) {
      prev.itemsA += (prev.itemsA ? glue : '') + part.itemsA;
      prev.itemsB += (prev.itemsB ? glue : '') + part.itemsB;
    } else {
      Array.prototype.push.apply(prev.itemsA, part.itemsA);
      Array.prototype.push.apply(prev.itemsB, part.itemsB);
    }
    prev.endA += part.itemsA.length;
    prev.endB += part.itemsB.length;
  };


  gdc.mergeChangePairs = function (fm) {
    var merged = [], prevPart;
    fm.forEach(function (part) {
      switch (prevPart && (prevPart.sign + part.sign)) {
      case '+-':
      case '-+':
        gdc.addItemsToPrevPart(prevPart, part, fm.glue);
        prevPart.sign = '±';
        return;
      }
      prevPart = part;
      return merged.push(part);
    });
    merged.glue = fm.glue;
    merged.lenA = fm.lenA;
    merged.lenB = fm.lenB;
    return merged;
  };


  gdc.unify = function (diff, ctxLen) {
    var unified = [], blk, prevCtx = false, addCtxRemain = 0;
    unified.lenA = 0;
    unified.lenB = 0;
    diff.forEach(function (part, partIdx) {
      var ctx, taken;
      if (isEmpty(part.sign) || isEmpty(part.itemsA) || isEmpty(part.itemsB)) {
        part = gdc.upgradePart(Object.assign({}, part), partIdx, unified);
      }
      if (part.sign === ' ') {
        ctx = part.itemsA.slice();
        if (addCtxRemain > 0) {
          taken = ctx.splice(0, addCtxRemain);
          blk.lenA += taken.length;
          blk.lenB += taken.length;
          taken.forEach(function (item) { blk.push([part.sign, item]); });
          addCtxRemain -= taken.length;
        }
        prevCtx = (((!prevCtx) || (ctx.length >= ctxLen)) ? ctx
          : prevCtx.concat(ctx));
      } else {
        if (prevCtx) {
          taken = ((ctxLen > 0) && prevCtx.slice(-ctxLen));
          if (prevCtx.length > ctxLen) { blk = false; }
          prevCtx = false;
        }
        if (!blk) {
          blk = [];
          blk.startA = unified.lenA - (taken ? taken.length : 0);
          blk.startB = unified.lenB - (taken ? taken.length : 0);
          blk.lenA = blk.lenB = 0;
          addHiddenProp(blk, 'toString', gdc.unify.blockToString);
          unified.push(blk);
        }
        if (taken) {
          blk.lenA += taken.length;
          blk.lenB += taken.length;
          taken.forEach(function (item) { blk.push([' ', item]); });
        }
        part.itemsA.forEach(function (item) { blk.push(['-', item]); });
        blk.lenA += part.itemsA.length;
        part.itemsB.forEach(function (item) { blk.push(['+', item]); });
        blk.lenB += part.itemsB.length;
        addCtxRemain = ctxLen;
      }
      unified.lenA += part.itemsA.length;
      unified.lenB += part.itemsB.length;
    });
    addHiddenProp(unified, 'toString', gdc.unify.diffToString);
    return unified;
  };
  gdc.unify.blockToString = function () {
    var natNumStart = 1;
    return [ ('@@ -' + (this.startA + natNumStart) +
                       (this.lenA === 1 ? '' : ',' + this.lenA) +
                ' +' + (this.startB + natNumStart) +
                       (this.lenB === 1 ? '' : ',' + this.lenB) +
                ' @@')
            ].concat(this.map(function (ln) { return ln.join(''); })
            ).join('\n');
  };
  gdc.unify.diffToString = function () {
    return this.map(Function.call.bind(gdc.unify.blockToString)).join('\n');
  };



















  return gdc;
}());
