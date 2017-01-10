/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('usnam-pmb');

var EX = module.exports, assert = require('assert'),
  stripCommonPrefix = require('generic-common-prefix').strip;


EX.arrEq = function (actual, expect) {
  if (!expect) {
    expect = actual;
    actual = expect.shift();
  }
  stripCommonPrefix(actual, expect, 0, 0, 1);
  try {
    assert.deepStrictEqual(actual, expect);
  } catch (assErr) {
    assErr.message = assErr.message.replace(/ (deepStrictEqual) /,
      // AssertionError: …
      '\n  =/=           ').replace(/( )\n/g, '$1¶\n');
    throw assErr;
  }
  return true;
};


EX.splitLn = function (s) { return (s ? s.split(/\n/) : []); };


EX.strLnEq = function (spec) {
  spec[0] = EX.splitLn(String(spec[0]));
  return EX.arrEq(spec);
};


EX.dumpDiff = function (diff) {
  var data, varPtn = /([ABP]?)([a-z]+)/g,
    tmpl = 'Astart+Alen=Aend [sign] Bstart+Blen=Bend <Aitems|Bitems>';
  function render(m, side, slot) {
    m = data[side || ''][slot];
    if ((typeof m) === 'number') { m = ('    ' + m).slice(-3); }
    return String(m);
  }
  function upg(side) {
    var len = side.items.length;
    side.len = len;
    side.end = side.start + len;
  }
  return [ (diff.a.len + ':' + diff.b.len) ].concat(diff.map(function (part) {
    upg(part.a);
    upg(part.b);
    data = { A: part.a, B: part.b, '': part };
    return tmpl.replace(varPtn, render);
  }));
};









/*scroll*/
