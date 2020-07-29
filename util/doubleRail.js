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

function doubleRail(diff, opt) {
  if (!opt) { opt = false; }
  var hunkSep = (opt.hunkSep || ' […] '),
    quot = (opt.quot || JSON.stringify),
    oldRail = '--- ',
    newRail = '+++ ';
  console.error('=====', opt);
  diff.forEach(function railHunk(hunkData, hunkIdx) {
    if (hunkIdx) {
      oldRail += hunkSep;
      newRail += hunkSep;
    }
    hunkData.forEach(function (part) {
      console.error({ part: part });
      var sign = part[0], text = quot(part[1]);
      oldRail += railAdd((sign !== '+'), text);
      newRail += railAdd((sign !== '-'), text);
    });
  });
  oldRail += (opt.oldRailAnnot || '');
  newRail += (opt.newRailAnnot || '');
  return [oldRail, newRail, String(diff)].join('\n');
}


module.exports = doubleRail;
