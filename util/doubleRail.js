/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

// See package "equal-pmb" for an example of how to use this.

function measure(x) { return (+(x || false).length || 0); }

function railAdd(active, tx) {
  if (active) { return tx; }
  tx = tx.replace(/[\s\S]/g, ' ');
  tx = tx.replace(/^ {3}/, ' … ');
  tx = tx.replace(/ {3}$/, ' … ');
  return tx;
}


function joinStr(parts) { return parts.join(this); }

function unquoteWeld(parts) {
  return parts.reduce(function add(have, next) {
    if (have.slice(-1) === next.slice(0, 1)) {
      return have.slice(0, -1).concat(next.slice(1));
    }
    return have.concat(next);
  });
}


function doubleRail(diff, opt) {
  if (!opt) { opt = false; }
  var oldRail = [], newRail = [], weld = opt.weld,
    hunkSep = (opt.hunkSep || ' […] '),
    quot = (opt.quot || JSON.stringify);
  diff.forEach(function railHunk(hunkData, hunkIdx) {
    if (hunkIdx) {
      oldRail.push(hunkSep);
      newRail.push(hunkSep);
    }
    hunkData.forEach(function (part) {
      var sign = part[0], text = quot(part[1]);
      oldRail.push(railAdd((sign !== '+'), text));
      newRail.push(railAdd((sign !== '-'), text));
    });
  });
  if (weld === false) { return { o: oldRail, n: newRail, d: diff }; }
  if (typeof weld === 'string') { return joinStr.bind(weld); }
  if (!weld) { weld = unquoteWeld; }
  oldRail = '--- ' + weld(oldRail, opt) + (opt.oldRailAnnot || '');
  newRail = '+++ ' + weld(newRail, opt) + (opt.newRailAnnot || '');
  return [oldRail, newRail, String(diff)].join('\n');
}


module.exports = doubleRail;
