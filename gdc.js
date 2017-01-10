﻿/*jslint indent: 2, maxlen: 80, node: true */
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
  function arrLast(a) { return a[a.length - 1]; }

  function bothSides(x, y, func) {
    if (!func) { func = y; }
    if (!func) { return [ x('a'), x('b') ]; }
    return [ func(x.a, y.a), func(x.b, y.b) ];
  }

  //function bothSides.recalcPartEnds(part) {
  //  part.a.end = part.a.start + part.a.len;
  //  part.b.end = part.b.start + part.b.len;
  //}


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
    if (!Array.isArray(fullDiffReport)) {
      throw new TypeError('Expected original diff report to be an array');
    }

    fullMerge.a = { len: 0 };
    fullMerge.b = { len: 0 };

    opt = Object.assign({}, opt);
    unified = opt.unified;
    if (typeof unified === 'number') {
      if (opt.finalLf !== false) { opt.finalLf = true; }
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
    // fullMerge.forEach(bothSides.recalcPartEnds);
    gdc.updateLastPartIndices(fullMerge);
    if (opt.finalLf) { gdc.checkFinalLfBothSides(fullMerge); }
    if (unified !== false) {
      return gdc.unify(fullMerge, unified, opt);
    }
    return fullMerge;
  };


  gdc.updateLastPartIndices = function (diff) {
    var lpA = 0, lpB = 0, idx, d;
    function len(x) { return (x.items || x).length; }
    for (idx = diff.length - 1; idx > 0; idx -= 1) {
      d = diff[idx];
      //console.error('upd lastPart:', idx, d.a, d.b);
      if (len(d.a)) { lpA = idx; }
      if (len(d.b)) { lpB = idx; }
      if (lpA && lpB) { break; }
    }
    diff.a.lastPart = lpA;
    diff.b.lastPart = lpB;
  };


  gdc.dropTrailingEmptyParts = function (diff) {
    var lastDataPartIdx = Math.max(diff.a.lastPart, diff.b.lastPart),
      firstDropIdx = lastDataPartIdx + 1;
    if (firstDropIdx >= diff.length) { return; }
    diff.splice(firstDropIdx);
    //console.error('diff part count after dropping:', diff.length);
  };


  gdc.scanPart = function (fullMerge, part, partIdx) {
    var prev = (arrLast(fullMerge) || false), glue = fullMerge.glue;
    part = gdc.upgradePart(Object.assign({}, part), partIdx, fullMerge);
    bothSides(part, fullMerge, function (partSide, mergeSide) {
      if (truthyOr(glue, '')) {
        partSide.items = tryJoin(glue, partSide.items);
      }
      partSide.start = mergeSide.len;
      mergeSide.len += partSide.items.length;
    });
    if (part.sign === prev.sign) {
      gdc.addItemsToPrevPart(prev, part, glue);
      return;
    }
    fullMerge.push(part);
  };


  function maybeScanPartError(rly, diff, partIdx, msg) {
    if (!rly) { return; }
    msg += ' part ' + partIdx + ' (after items #' + diff.a.len +
      ' / ' + diff.b.len + ')';
    throw new Error(msg);
  }


  gdc.upgradePart = function (part, partIdx, fm) {
    if (!part.sign) {
      part.sign = (part.added ? (part.removed ? '±' : '+')
                              : (part.removed ? '-' : ' '));
    }
    if (!part.a) { part.a = {}; }
    if (!part.b) { part.b = {}; }
    var items = part.items,
      emptyA = (part.a.items === undefined),
      emptyB = (part.b.items === undefined);
    if (emptyA || emptyB) {
      maybeScanPartError(part.sign === '±', fm, partIdx,
        'Cannot find items for combined add/remove');
      maybeScanPartError(items === undefined, fm, partIdx,
        'Cannot upgrade: No item list in');
      if (emptyA) { part.a.items = (part.added   ? [] : part.items); }
      if (emptyB) { part.b.items = (part.removed ? [] : part.items); }
      delete part.items;
    }
    return part;
  };


  gdc.addItemsToPrevPart = function (prev, crnt, glue) {
    bothSides(prev, crnt, function each(prevSide, partSide) {
      var add = partSide.items;
      if (truthyOr(glue, '')) {
        prevSide.items += (prevSide.items ? glue : '') + add;
      } else {
        // don't push to each side unless we know they're different arrays!
        prevSide.items = prevSide.items.concat(add);
      }
      prevSide.len += add.length;
    });
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
    merged.a = { len: fm.a.len };
    merged.b = { len: fm.b.len };
    return merged;
  };


  gdc.checkFinalLfBothSides = function (fm) {
    var flags = {};
    function lastPart(side) { return fm[fm[side].lastPart]; }
    bothSides(function adjust(side) {
      var part = lastPart(side)[side], itm = part.items, fin;
      if (!itm.length) { return; }
      fin = (arrLast(itm) === (isStr(itm) ? '\n' : ''));
      fm[side].finalLf = flags[side] = fin;
      if (fin) { part.items = itm.slice(0, -1); }
      //console.error('finLf adj:', side, part);
    });
    gdc.updateLastPartIndices(fm);
    gdc.dropTrailingEmptyParts(fm);
    bothSides(function annot(side) {
      var part = lastPart(side);
      if (!part.finalLf) { part.finalLf = {}; }
      part.finalLf[side] = flags[side];
      console.error(part);
    });

    //flags = { a: lastPart('a'), b: lastPart('b') };
    //if (flags.a === flags.b) {
    //  console.error('finLf flags both:', flags.a);
    //} else {
    //  console.error('finLf flags a/b:', flags.a, flags.b);
    //}
  };


  gdc.unicode = {
    downwardsArrowWithCornerLeftwards: '\u21B5',    // ↵ //
    enterSymbol: '\u2386',                          // ⎆ //
    rightwardsArrowToBar: '\u21E5',                 // ⇥ //
    rightwardsArrowWithHook: '\u21AA',              // ↪ //
    southEastArrowWithHook: '\u2925',               // ⤥ //
    symbolForLineFeed: '\u240A',                    // ␊ //
    symbolForNewline: '\u2424',                     // ␤ //
  };
  gdc.markLineFeedChars = (function () {
    var r = /\n/g, m = '\n^';
      // m = '\n' + gdc.unicode.rightwardsArrowWithHook;
    return function (s) { return s.replace(r, m); };
  }());


  // gdc.vocNoFinalLf = 'No newline at end of file';
  // gdc.vocNoFinalLf = gdc.unicode.rightwardsArrowToBar;
  gdc.vocNoFinalLf = '¬¶';


  gdc.unify = function (diff, ctxLen) {
    if (!(diff || false).length) { throw new Error('No input data'); }
    var unified = [], blk, blkAppendSign, prevCtx = false, addCtxRemain = 0;
    unified.a = { len: 0, lastPart: 0 };
    unified.b = { len: 0, lastPart: 0 };

    function startBlk(startAdj) {
      blk = [];
      blk.a = { start: unified.a.len + startAdj, len: 0 };
      blk.b = { start: unified.b.len + startAdj, len: 0 };
    }

    function blkAppendData(data) {
      if (isStr(data)) { return blk.push([blkAppendSign, data]); }
      if (data.forEach) { return data.forEach(blkAppendData); }
      throw new TypeError('Cannot make unified diff: unsupported item type');
    }

    function blkAppendItems(sign, items, finLf) {
      var len = items.length;
      if (!len) { return; }
      blkAppendSign = sign;
      if (len) { blkAppendData(items); }
      if (finLf !== undefined) {
        arrLast(blk).finalLf = finLf;
        //console.error('lastLn finLf?', [ sign, items, finLf ], blk);
      }
      if (sign !== '+') { blk.a.len += len; }
      if (sign !== '-') { blk.b.len += len; }
      return items;
    }

    diff.forEach(function (part, partIdx) {
      var newCtx, taken, itmA = part.a.items, itmB = part.b.items;
      if (isEmpty(part.sign) || isEmpty(itmA) || isEmpty(itmB)) {
        part = gdc.upgradePart(Object.assign({}, part), partIdx, unified);
      }
      //console.error('unify part', part);
      if (part.sign === ' ') {
        newCtx = itmA.slice();
        if (addCtxRemain > 0) {
          taken = newCtx.splice(0, addCtxRemain);
          blkAppendItems(' ', taken);
          addCtxRemain -= taken.length;
        }
        if (prevCtx) {
          if (newCtx.length < ctxLen) {
            // we need to re-use some old lines
            newCtx = prevCtx.items.slice(0, -ctxLen).concat(newCtx);
          }
        }
        prevCtx = { items: newCtx, finalLf: part.finalLf };
      } else {
        if (prevCtx) {
          taken = ((ctxLen > 0) && prevCtx.items.slice(-ctxLen));
          if (prevCtx.items.length > ctxLen) { blk = false; }
        }
        if (!blk) {
          startBlk(taken ? -taken.length : 0);
          addHiddenProp(blk, 'toString', gdc.unify.blockToString);
          unified.push(blk);
        }
        if (taken) { blkAppendItems(' ', taken, prevCtx.finalLf); }
        blkAppendItems('-', itmA, part.finalLf);
        blkAppendItems('+', itmB, part.finalLf);
        addCtxRemain = ctxLen;
        prevCtx = false;
      }
      unified.a.len += itmA.length;
      unified.b.len += itmB.length;
    });

    // unified.forEach(bothSides.recalcPartEnds);
    gdc.updateLastPartIndices(unified);
    bothSides(unified, diff, function (u, d) {
      if (d.finalLf !== undefined) { u.finalLf = d.finalLf; }
    });
    addHiddenProp(unified, 'toString', gdc.unify.diffToString);
    return unified;
  };
  gdc.unify.blockToString = function () {
    var blk = this, natNumStart = 1,
      diff = ('@@ -' + (blk.a.start + natNumStart) +
                       (blk.a.len === 1 ? '' : ',' + blk.a.len) +
                ' +' + (blk.b.start + natNumStart) +
                       (blk.b.len === 1 ? '' : ',' + blk.b.len) +
                ' @@');
    //console.error('blk2str:', blk);
    blk.forEach(function (ln) {
      //console.error('fmtBlkLn', ln);
      var sign = ln[0], text = ln[1], fin = ln.finalLf;
      diff += '\n' + sign + gdc.markLineFeedChars(text);
      if (fin) {
        fin = (sign === '-' ? fin.a : fin.b);
        if (fin === false) { diff += '\n\\ ' + gdc.vocNoFinalLf; }
      }
    });
    return diff;
  };
  gdc.unify.diffToString = function () {
    return this.map(Function.call.bind(gdc.unify.blockToString)).join('\n');
  };



















  return gdc;
}());
