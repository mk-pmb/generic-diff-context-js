/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('usnam-pmb');

var diffCtx = require('generic-diff-context'), a, b, opt,
  tu = require('./lib-test-util.js');

function toWords(s) { return s.split(/\s+/); }

a = "hello world";
b = "help arnold";
tu.arrEq([tu.dumpDiff(diffCtx(a, b)),
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
tu.arrEq([tu.dumpDiff(diffCtx(a, b)),
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
tu.arrEq([tu.dumpDiff(diffCtx(a, b, opt)),
  '9:8',
  '  0+  1=  1 [ ]   0+  1=  1 <The|The>',
  '  1+  0=  1 [+]   1+  1=  2 <|fuzzy>',
  '  1+  1=  2 [ ]   2+  1=  3 <quick|quick>',
  '  2+  2=  4 [±]   3+  1=  4 <brown,fox|kitten>',
  '  4+  3=  7 [ ]   4+  3=  7 <jumps,over,the|jumps,over,the>',
  '  7+  1=  8 [-]   7+  0=  7 <lazy|>',
  '  8+  1=  9 [ ]   7+  1=  8 <dog.|dog.>'
  ]);













/*scroll*/
