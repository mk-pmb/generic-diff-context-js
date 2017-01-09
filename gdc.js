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
    var fullDiffReport, fullMerge = [], unified;
    // don't use `opt` here because we don't yet know whether it's in `b`.
    switch (b && typeof b) {
    case '':
    case 'string':
      fullDiffReport = genDiff(a, b);
      break;
    case 'object':
      if (opt || Array.isArray(b)) {
        fullDiffReport = genDiff(a, b);
      } else {
        fullDiffReport = a;
        opt = b;
        b = null;
      }
      break;
    }

    // Don't combine A/B assignments or the order in the object will
    // be the reverse of the order in code, ugly.
    fullMerge.lenA = 0;
    fullMerge.lenB = 0;
    fullMerge.lastPartA = 0;
    // ^-- Section index within the diff report. Not: Position in original A.
    fullMerge.lastPartB = 0;

    opt = Object.assign({}, opt);
    unified = opt.unified;
    if (typeof unified === 'number') {
      if (opt.finalEol !== false) { opt.finalEol = true; }
    } else {
      unified = false;
    }
    if (opt.glue === undefined) {
      fullMerge.glue = (isStr(a) && isStr(b) && '');
    } else {
      fullMerge.glue = (opt.glue === '' ? '' : (opt.glue || false));
    }

    fullDiffReport.forEach(gdc.scanPart.bind(null, fullMerge));
    if (opt.mergePairs) { fullMerge = gdc.mergeChangePairs(fullMerge, opt); }
    if (opt.finalEol) { gdc.checkFinalEol(fullMerge); }
    if (unified !== false) {
      return gdc.unify(fullMerge, unified, opt);
    }
    return fullMerge;
  };


  gdc.upgradePart = function (part, partIdx, fm) {
    if (!part.sign) {
      part.sign = (part.added ? (part.removed ? '±' : '+')
                              : (part.removed ? '-' : ' '));
    }
    var emptyA = (part.itemsA === undefined),
      emptyB = (part.itemsB === undefined);
    if (emptyA || emptyB) {
      if (part.sign === '±') {
        throw new Error('Cannot find items for combined add/remove part #' +
          partIdx + ' (after items #' + fm.lenA + ' / ' + fm.lenB + ')');
      }
      if (emptyA) { part.itemsA = (part.added   ? [] : part.items); }
      if (emptyB) { part.itemsB = (part.removed ? [] : part.items); }
      delete part.items;
    }
    return part;
  };


  gdc.scanPart = function (fm, part, partIdx) {
    var prev = (fm[fm.length - 1] || false), len;
    part = gdc.upgradePart(Object.assign({}, part), partIdx, fm);
    if (truthyOr(fm.glue, '')) {
      part.itemsA = tryJoin(fm.glue, part.itemsA);
      part.itemsB = tryJoin(fm.glue, part.itemsB);
    }
    part.startA = fm.lenA;
    part.startB = fm.lenB;
    len = part.itemsA.length;
    if (len) {
      fm.lenA += len;
      fm.lastPartA = partIdx;
    }
    len = part.itemsB.length;
    if (len) {
      fm.lenB += len;
      fm.lastPartB = partIdx;
    }
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


  gdc.checkFinalEol = function (fm) {
    var flags = {}, lastA = fm[fm.lastPartA], lastB = fm[fm.lastPartB];
    function checkFlag(side, items) {
      flags[side] = (items.slice(-1) === (isStr(items) ? '\n' : ''));
      //console.error('eol flag?', side, { items: items }, flags[side]);
    }
    checkFlag('a', lastA.itemsA);
    if (lastA === lastB) {
      flags.b = flags.a;
      lastA.finalEol = flags;
      //console.error('eol flags both:', lastA);
    } else {
      lastA.finalEol = { a: flags.a };
      checkFlag('b', lastB.itemsB);
      lastB.finalEol = { b: flags.b };
      //console.error('eol flags a/b:', lastA, lastB);
    }
    fm.finalEol = flags;
  };


  gdc.unicode = {
    arrows: {
      downwardsArrowWithCornerLeftwards: '\u21B5',    // ↵
      rightwardsArrowWithHook: '\u21AA',              // ↪
    },
    controlPictures: {
      symbolForLineFeed: '\u240A',                    // ␊
      symbolForNewline: '\u2424',                     // ␤
    },
    miscellaneousTechnical: {
      enterSymbol: '\u2386',                          // ⎆
    },
    supplementalArrowsB: {
      southEastArrowWithHook: '\u2925',               // ⤥
    },
  };
  gdc.markLineFeedChars = (function () {
    var r = /\n/g, m = '\n' + gdc.unicode.arrows.rightwardsArrowWithHook;
    return function (s) { return s.replace(r, m); };
  }());


  gdc.vocNoFinalEol = 'No newline at end of file';


  gdc.unify = function (diff, ctxLen) {
    if (!(diff || false).length) { throw new Error('No input data'); }
    var unified = [], blk, blkAppendSign, prevCtx = false, addCtxRemain = 0;
    unified.lenA = 0;
    unified.lenB = 0;

    function blkAppendData(data) {
      if (isStr(data)) { return blk.push([blkAppendSign, data]); }
      if (data.forEach) { return data.forEach(blkAppendData); }
      throw new TypeError('Cannot make unified diff: unsupported item type');
    }

    function blkAppendItems(sign, items, finEol) {
      blkAppendSign = sign;
      blkAppendData(items);
      if (sign !== '+') { blk.lenA += items.length; }
      if (sign !== '-') { blk.lenB += items.length; }
      if (finEol !== undefined) {
        blk[blk.length - 1].finalEol = finEol;
        //console.error('blk[-1] finEol?', [ sign, finalEol ], blk);
      }
    }

    diff.forEach(function (part, partIdx) {
      var newCtx, taken, itmA = part.itemsA, itmB = part.itemsB;
      if (isEmpty(part.sign) || isEmpty(itmA) || isEmpty(itmB)) {
        part = gdc.upgradePart(Object.assign({}, part), partIdx, unified);
      }
      if (part.sign === ' ') {
        newCtx = itmA.slice();
        if (addCtxRemain > 0) {
          taken = newCtx.splice(0, addCtxRemain);
          blkAppendItems(' ', taken, part.finalEol);
          addCtxRemain -= taken.length;
        }
        if (prevCtx) {
          if (newCtx.length < ctxLen) {
            // we need to re-use some old lines
            newCtx = prevCtx.items.slice(0, -ctxLen).concat(newCtx);
          }
        }
        prevCtx = { items: newCtx, finalEol: part.finalEol };
      } else {
        if (prevCtx) {
          taken = ((ctxLen > 0) && prevCtx.items.slice(-ctxLen));
          if (prevCtx.items.length > ctxLen) { blk = false; }
        }
        if (!blk) {
          blk = [];
          blk.startA = unified.lenA - (taken ? taken.length : 0);
          blk.startB = unified.lenB - (taken ? taken.length : 0);
          blk.lenA = 0;   // cf. "Don't combine A/B assignments" above
          blk.lenB = 0;
          addHiddenProp(blk, 'toString', gdc.unify.blockToString);
          unified.push(blk);
        }
        if (taken) { blkAppendItems(' ', taken, prevCtx.finalEol); }
        blkAppendItems('-', itmA, part.finalEol);
        blkAppendItems('+', itmB, part.finalEol);
        addCtxRemain = ctxLen;
        prevCtx = false;
      }
      unified.lenA += itmA.length;
      unified.lenB += itmB.length;
    });

    if (diff.finalEol) { unified.finalEol = diff.finalEol; }
    addHiddenProp(unified, 'toString', gdc.unify.diffToString);
    return unified;
  };
  gdc.unify.fmtDiffLine = function (ln) {
    var sign = ln[0], text = ln[1], finEol = ln.finalEol, addToDiff = '';
    if (finEol) {
      console.error('fmtDiffLine finEol?', ln);
    }
    addToDiff = '\n' + sign + gdc.markLineFeedChars(text);
    if (finEol) { addToDiff += '<fin>'; }
    // if (finEol === false) { diff += '\n\\ ' + gdc.vocNoFinalEol; }
    return addToDiff;
  };
  gdc.unify.blockToString = function () {
    var blk = this, natNumStart = 1,
      diff = ('@@ -' + (blk.startA + natNumStart) +
                       (blk.lenA === 1 ? '' : ',' + blk.lenA) +
                ' +' + (blk.startB + natNumStart) +
                       (blk.lenB === 1 ? '' : ',' + blk.lenB) +
                ' @@');
    //console.error('blk2str:', blk);
    diff += blk.map(gdc.unify.fmtDiffLine).join('');
    return diff;
  };
  gdc.unify.diffToString = function () {
    return this.map(Function.call.bind(gdc.unify.blockToString)).join('\n');
  };



















  return gdc;
}());
