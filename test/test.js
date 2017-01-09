/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';


require('usnam-pmb');

var diffCtx = require('generic-diff-context'), a, b, opt,
  assert = require('assert'), eq = assert.deepStrictEqual,
  stripCommonPrefix = require('generic-common-prefix').strip,
  usageDemo = require('./usage.demo.js');


function toWords(s) { return s.split(/\s+/); }


function arrEq(actual, expect) {
  if (!expect) {
    expect = actual;
    actual = expect.shift();
  }
  stripCommonPrefix(actual, expect, 0, 0, 1);
  eq(actual, expect);
}


//a = [ 'foo', 'bar'   ].join('\n');
//b = [ 'foo', 'bar', ''     ].join('\n');
a = [ 'foo' ];
b = [ 'bar' ];
opt = { unified: 2 };
arrEq([String(diffCtx(a, b, opt)).split(/\n/),
  '']);


(function verifyUsageDemo() {
  var actual = [], expected = [];
  usageDemo(usageDemo.dumpTo.bind(actual));
  String(usageDemo).replace(/\n\s*\/{2}=\s*`([ -~]*)`(?=\n)/g,
    function (m, exln) { expected.push(m && exln); });
  arrEq(actual, expected);
}());


function dumpDiff(diff) {
  return [ (diff.lenA + ':' + diff.lenB) ].concat(diff.map(function (part) {
    part.lenA = part.itemsA.length;
    part.lenB = part.itemsB.length;
    return dumpDiff.tmpl.replace(/\w+/g, function (m) {
      m = part[m];
      if ((typeof m) === 'number') { m = ('    ' + m).slice(-3); }
      return String(m);
    });
  }));
}
dumpDiff.tmpl = 'startA+lenA=endA [sign] startB+lenB=endB <itemsA|itemsB>';


a = "hello world";
b = "help arnold";
arrEq([dumpDiff(diffCtx(a, b)),
  '11:11',
  '  0+  3=  3 [ ]   0+  3=  3 <hel|hel>',
  '  3+  2=  5 [-]   3+  0=  3 <lo|>',
  '  5+  0=  5 [+]   3+  1=  4 <|p>',
  '  5+  1=  6 [ ]   4+  1=  5 < | >',
  '  6+  2=  8 [-]   5+  0=  5 <wo|>',
  '  8+  0=  8 [+]   5+  1=  6 <|a>',
  '  8+  1=  9 [ ]   6+  1=  7 <r|r>',
  '  9+  0=  9 [+]   7+  2=  9 <|no>',
  '  9+  2= 11 [ ]   9+  2= 11 <ld|ld>'
  ]);


a = toWords("The       quick brown fox    jumps over the lazy dog.");
b = toWords("The fuzzy quick       kitten jumps over the      dog.");
arrEq([dumpDiff(diffCtx(a, b)),
  '9:8',
  '  0+  1=  1 [ ]   0+  1=  1 <The|The>',
  '  1+  0=  1 [+]   1+  1=  2 <|fuzzy>',
  '  1+  1=  2 [ ]   2+  1=  3 <quick|quick>',
  '  2+  2=  4 [-]   3+  0=  3 <brown,fox|>',
  '  4+  0=  4 [+]   3+  1=  4 <|kitten>',
  '  4+  3=  7 [ ]   4+  3=  7 <jumps,over,the|jumps,over,the>',
  '  7+  1=  8 [-]   7+  0=  7 <lazy|>',
  '  8+  1=  9 [ ]   7+  1=  8 <dog.|dog.>'
  ]);


a = toWords("The       quick brown fox    jumps over the lazy dog.");
b = toWords("The fuzzy quick       kitten jumps over the      dog.");
opt = { mergePairs: true };
arrEq([dumpDiff(diffCtx(a, b, opt)),
  '9:8',
  '  0+  1=  1 [ ]   0+  1=  1 <The|The>',
  '  1+  0=  1 [+]   1+  1=  2 <|fuzzy>',
  '  1+  1=  2 [ ]   2+  1=  3 <quick|quick>',
  '  2+  2=  4 [±]   3+  1=  4 <brown,fox|kitten>',
  '  4+  3=  7 [ ]   4+  3=  7 <jumps,over,the|jumps,over,the>',
  '  7+  1=  8 [-]   7+  0=  7 <lazy|>',
  '  8+  1=  9 [ ]   7+  1=  8 <dog.|dog.>'
  ]);


a = toWords("The       quick brown fox    jumps over the lazy dog.");
b = toWords("The fuzzy quick       kitten jumps over the      dog.");
opt = { unified: 1, finalEol: false };
arrEq([diffCtx(a, b, opt).map(String),
  ('@@ -1,5 +1,5 @@\n' +
    ' The\n' +
    '+fuzzy\n' +
    ' quick\n' +
    '-brown\n' +
    '-fox\n' +
    '+kitten\n' +
    ' jumps'),
  ('@@ -7,3 +7,2 @@\n' +
    ' the\n' +
    '-lazy\n' +
    ' dog.'),
  ]);


a = toWords("The       quick brown fox    jumps over a dog.");
b = toWords("A   fuzzy quick brown kitten jumps over a dog!");
opt = { unified: 0, finalEol: false };
arrEq([String(diffCtx(a, b, opt)).split(/\n/),
  '@@ -1 +1,2 @@',  '-The',     '+A', '+fuzzy',
  '@@ -4 +5 @@',    '-fox',     '+kitten',
  '@@ -8 +9 @@',    '-dog.',    '+dog!',
  ]);


a = toWords("The       quick brown fox    jumps over a dog.");
b = toWords("A   fuzzy quick brown kitten jumps over a dog!");
opt = { unified: 1, finalEol: false };
arrEq([String(diffCtx(a, b, opt)).split(/\n/),
  '@@ -1,5 +1,6 @@',
  '-The', '+A', '+fuzzy',
  ' quick', ' brown',
  '-fox', '+kitten',
  ' jumps',
  '@@ -7,2 +8,2 @@',
  ' a',
  '-dog.', '+dog!',
  ]);


a = toWords("The       quick brown fox    jumps over a dog.");
b = toWords("A   fuzzy quick brown kitten jumps over a dog!");
opt = { unified: 2, finalEol: false };
arrEq([String(diffCtx(a, b, opt)).split(/\n/),
  '@@ -1,8 +1,9 @@',
  '-The', '+A', '+fuzzy',
  ' quick', ' brown',
  '-fox', '+kitten',
  ' jumps', ' over', ' a',
  '-dog.', '+dog!',
  ]);
















console.log('+OK all tests passed.');
