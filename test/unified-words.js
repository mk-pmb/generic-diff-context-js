/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('usnam-pmb');

var diffCtx = require('generic-diff-context'), a, b, opt = { finalLf: false },
  tu = require('./lib-test-util.js');

function toWords(s) { return s.split(/\s+/); }

a = toWords("The       quick brown fox    jumps over the lazy dog.");
b = toWords("The fuzzy quick       kitten jumps over the      dog.");
opt.unified = 1;
tu.arrEq([diffCtx(a, b, opt).map(String),
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
opt.unified = 0;
tu.strLnEq([diffCtx(a, b, opt),
  '@@ -1 +1,2 @@',  '-The',     '+A', '+fuzzy',
  '@@ -4 +5 @@',    '-fox',     '+kitten',
  '@@ -8 +9 @@',    '-dog.',    '+dog!',
  ]);


a = toWords("The       quick brown fox    jumps over a dog.");
b = toWords("A   fuzzy quick brown kitten jumps over a dog!");
opt.unified = 1;
tu.strLnEq([diffCtx(a, b, opt),
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
opt.unified = 2;
tu.strLnEq([diffCtx(a, b, opt),
  '@@ -1,8 +1,9 @@',
  '-The', '+A', '+fuzzy',
  ' quick', ' brown',
  '-fox', '+kitten',
  ' jumps', ' over', ' a',
  '-dog.', '+dog!',
  ]);
















/*scroll*/
