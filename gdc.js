/*jslint indent: 2, maxlen: 80, node: true */
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
  function isFin(x) { return ((typeof x === 'number') && isFinite(x)); }
  //function ifFin(x, d) { return (isFin(x) ? x : d); }
  function isStr(x) { return (typeof x === 'string'); }
  function isObj(x) { return ((x && typeof x) === 'object'); }
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
    unified = gdc.parseOpt_unified(opt.unified);
    if (opt.glue === undefined) {
      fullMerge.glue = (isStr(a) && isStr(b) && '');
    } else {
      fullMerge.glue = (opt.glue === '' ? '' : (opt.glue || false));
    }

    //console.error('orig report:', fullDiffReport);
    fullDiffReport.forEach(gdc.scanPart.bind(null, fullMerge));
    if (opt.mergePairs) { fullMerge = gdc.mergeChangePairs(fullMerge, opt); }
    // fullMerge.forEach(bothSides.recalcPartEnds);
    gdc.updateLastPartIndices(fullMerge);
    //console.error('fullMerge:', fullMerge);
    if (opt.finalLf !== false) {
      if (opt.finalLf || unified) {
        gdc.checkFinalLfBothSides(fullMerge);
      }
    }
    if (unified) {
      return gdc.unify(fullMerge, unified.before, unified.after);
    }
    return fullMerge;
  };


  gdc.parseOpt_unified = function (u) {
    if (isFin(u)) { return { before: u, after: u }; }
    if (!u) { return false; }
    if (isFin(u.before) || isFin(u.after) || isFin(u[0]) || isFin(u[1])) {
      return { before: (+u.before || +u[0] || 0),
        after: (+u.after || +u[1] || 0) };
    }
    return false;
  };


  gdc.updateLastPartIndices = function (diff) {
    var lpA = 0, lpB = 0, idx, d;
    function len(x) {
      var l = x.len, i = x.items;
      if (x.finalLf && (i === '')) { return true; }
      return (l === +l ? l : i.length);
    }
    for (idx = diff.length - 1; idx > 0; idx -= 1) {
      d = diff[idx];
      //console.error('upd lastPart:', idx, len(d.a), len(d.b), d);
      if (len(d.a) && (lpA === 0)) { lpA = idx; }
      if (len(d.b) && (lpB === 0)) { lpB = idx; }
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
    var flags = {}, lpts = {};
    if (fm.length === 0) { return; }
    function lastPart(side) { return fm[fm[side].lastPart]; }
    bothSides(function adjust(side) {
      var part = lastPart(side), pSide = part[side], itm = pSide.items, fin;
      //console.error('finLf chk: lp(' + side + ') =', part);
      if (itm.length) {
        fin = (arrLast(itm) === (isStr(itm) ? '\n' : ''));
      } else {
        fin = false;  // no items = especially no finLf
      }
      fm[side].finalLf = flags[side] = fin;
      if (fin) { pSide.items = itm.slice(0, -1); }
      //console.error('finLf adj:', side, fin, pSide);
    });
    gdc.updateLastPartIndices(fm);
    gdc.dropTrailingEmptyParts(fm);
    bothSides(function annot(side) {
      var part = lastPart(side);
      lpts[side] = part;
      if (!part.finalLf) { part.finalLf = {}; }
      part.finalLf[side] = flags[side];
    });

    if (lpts.a === lpts.b) {
      //console.error('finLf lpts both:', flags, lpts.a);
      if (flags.a !== flags.b) { gdc.splitFinalLfPart(fm); }
    //} else {
      //console.error('finLf lpts a/b:', lpts.a, lpts.b);
    }
  };


  gdc.cloneDiffPart = function copy(src, dest, upd) {
    upd = (upd || false);
    dest = (dest || (Array.isArray(src) ? [] : {}));
    function add(k, v) { dest[k] = v; }
    Object.keys(src).forEach(function (k) {
      var v = upd[k];
      if (v === undefined) { v = src[k]; }
      if (v === undefined) { return; }
      if (!isObj(v)) { return add(k, v); }
      if (k === 'items') { return add(k, v.slice()); }
      return add(k, copy(v));
    });
    return dest;
  };


  gdc.singleOutLastItemsOfLastPart = function (fm, n) {
    if (n !== 0) { n = (+n || 1); }
    var srcPt = arrLast(fm), newPt = {};
    //console.error('sepLastItem?', srcPt);
    if ((srcPt.a.items.length <= n) && (srcPt.b.items.length <= n)) {
      //console.error('sepLastItem: no-op!');
      return srcPt;
      // both sides have at most n items, so if we took them, we'd create:
      // fm[fm.length - 2] = srcPt but empty
      // fm[fm.length - 1] = copy of srcPt with all items
    }
    bothSides(function (side) {
      var lpSide = srcPt[side], itm = lpSide.items,
        newSide = { items: itm.slice(-n) };
      newPt[side] = newSide;
      itm = lpSide.items = itm.slice(0, -n);
      newSide.start = lpSide.start + itm.length;
    });
    newPt = gdc.cloneDiffPart(srcPt, null, newPt);
    delete srcPt.finalLf;   // <- may survive only in newPt
    fm.push(newPt);
    //console.error('sepLastItem:', srcPt, '\n ', newPt);
    return newPt;
  };


  gdc.splitFinalLfPart = function (fm) {
    var origPt = gdc.singleOutLastItemsOfLastPart(fm, 1), ptA, ptB,
      fin  = (origPt.finalLf || false), sideA = origPt.a, sideB = origPt.b;
    if (fin.a === fin.b) { return; }
    if (fin.a === undefined) { return; }
    if (fin.b === undefined) { return; }
    if (origPt.sign !== ' ') {
      //console.error('splitFinalLfPart: panic:', ptA);
      throw new Error('Cannot split finalLf part with sign ' + ptA.sign);
    }
    ptA = origPt;
    ptA.sign = '-';
    ptA.removed = true;
    ptA.added = false;
    function copySide(src) {
      return { items: src.items.slice(0, 0), start: src.start };
    }
    ptB = { added: true, removed: false, sign: '+',
      a: copySide(sideA), b: ptA.b, finalLf: { b: fin.b } };
    ptA.finalLf = { a: fin.a };
    ptA.b = copySide(sideB);
    fm.b.lastPart = fm.length;
    fm.push(ptB);
    //console.error('splitFinalLfPart', ptA, '\n ', ptB);
  };


  gdc.markLineFeedChars = (function () {
    var r = /\n/g, m = '\n^';
      // m = '\n' + gdc.unicode.rightwardsArrowWithHook;
    return function (s) { return s.replace(r, m); };
  }());


  // gdc.vocNoFinalLf = 'No newline at end of file';
  // gdc.vocNoFinalLf = gdc.unicode.rightwardsArrowToBar;
  gdc.vocNoFinalLf = '¬¶';


  gdc.unify = function (diff, prefixLen, suffixLen) {
    var unified = [], blk, blkAppendSign,
      prevCtx = false, prevFinalLf, addCtxRemain = 0;
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
      blkAppendData(items);
      if (finLf !== undefined) {
        arrLast(blk).finalLf = finLf;
        //console.error('lastLn finLf?', [ sign, items ], finLf);
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
        // waiting for "after" context?
        if (addCtxRemain > 0) {
          taken = newCtx.slice(0, addCtxRemain);
          newCtx = newCtx.slice(addCtxRemain);
          // ^-- can't just .splice() because itmA might be a string
          blkAppendItems(' ', taken,
            // give finalLf only if we consumed the new part's last line:
            (newCtx.length === 0 ? part.finalLf : undefined));
          addCtxRemain -= taken.length;
        }
        // prepare for "before" context.
        if (prevCtx) {
          if (newCtx.length < prefixLen) {
            // We need to re-use some old lines.
            // How many? Let's just take n=prefixLen,
            taken = prevCtx.slice(0, -prefixLen);
            // that will always be enough and who cares
            // whether we keep more than we'd need.
            newCtx = taken.concat(newCtx);
          }
        }
        prevCtx = newCtx;
        prevFinalLf = part.finalLf;
      } else {
        // try to add the "before" context:
        if (prevCtx) {
          taken = ((prefixLen > 0) && prevCtx.slice(-prefixLen));
          // Skip remove items b/c we'll soon abandon the entire prevCtx.
          if (prevCtx.length > prefixLen) { blk = false; }
        }
        if (!blk) {
          startBlk(taken ? -taken.length : 0);
          addHiddenProp(blk, 'toString', gdc.unify.blockToString);
          unified.push(blk);
        }
        //if (taken) { console.error('taken2', taken, prevCtx, prevFinalLf); }
        if (taken) { blkAppendItems(' ', taken, prevFinalLf); }
        blkAppendItems('-', itmA, part.finalLf);
        blkAppendItems('+', itmB, part.finalLf);
        addCtxRemain = suffixLen;
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
