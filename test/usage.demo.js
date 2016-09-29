﻿/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function usageDemo(dump) {
  var genDiffCtx = require('generic-diff-context'), a, b, opt, diff;

  a = "hello world";
  b = "help arnold";
  dump(genDiffCtx(a, b));
  //= `[ { added: false, removed: false, sign: ' ',`
  //= `    itemsA: 'hel', itemsB: 'hel',`
  //= `    startA: 0, startB: 0, endA: 3, endB: 3 },`
  //= `  { added: false, removed: true,  sign: '-',`
  //= `    itemsA: 'lo', itemsB: '',`
  //= `    startA: 3, startB: 3, endA: 5, endB: 3 },`
  //= `  { added: true,  removed: false, sign: '+',`
  //= `    itemsA: '', itemsB: 'p',`
  //= `    startA: 5, startB: 3, endA: 5, endB: 4 },`
  //= `  ... 6 more items,`
  //= `  glue: '', lenB: 11, lenA: 11 ]`


  function toWords(s) { return s.split(/\s+/); }

  a = toWords("The       quick brown fox    jumps over the lazy dog.");
  b = toWords("The fuzzy quick       kitten jumps over the      dog.");
  dump(genDiffCtx(a, b));
  //= `[ { added: false, removed: false, sign: ' ',`
  //= `    itemsA: [ 'The' ], itemsB: [ 'The' ],`
  //= `    startA: 0, startB: 0, endA: 1, endB: 1 },`
  //= `  { added: true,  removed: false, sign: '+',`
  //= `    itemsA: [], itemsB: [ 'fuzzy' ],`
  //= `    startA: 1, startB: 1, endA: 1, endB: 2 },`
  //= `  { added: false, removed: false, sign: ' ',`
  //= `    itemsA: [ 'quick' ], itemsB: [ 'quick' ],`
  //= `    startA: 1, startB: 2, endA: 2, endB: 3 },`
  //= `  ... 5 more items,`
  //= `  glue: false, lenB: 8, lenA: 9 ]`


  a = toWords("The       quick brown fox    jumps over the lazy dog.");
  b = toWords("The fuzzy quick       kitten jumps over the      dog.");
  opt = { unified: 1 };
  diff = genDiffCtx(a, b, opt);

  dump(diff);
  //= `[ [ [ ' ', 'The' ],`
  //= `    [ '+', 'fuzzy' ],`
  //= `    [ ' ', 'quick' ],`
  //= `    ... 4 more items,`
  //= `    startA: 0, startB: 0, lenB: 5, lenA: 5, toString: [Function] ],`
  //= `  [ [ ' ', 'the' ],`
  //= `    [ '-', 'lazy' ],`
  //= `    [ ' ', 'dog.' ],`
  //= `    startA: 6, startB: 6, lenB: 2, lenA: 3, toString: [Function] ],`
  //= `  lenA: 9, lenB: 8, toString: [Function] ]`

  dump(diff.map(String));
  //= `[ '@@ -1,5 +1,5 @@\n The\n' +`
  //= `        '+fuzzy\n' +`
  //= `        ' quick\n' +`
  //= `        '-brown\n' +`
  //= `        '-fox\n' +`
  //= `        '+kitten\n' +`
  //= `        ' jumps',`
  //= `  '@@ -7,3 +7,2 @@\n the\n' +`
  //= `        '-lazy\n' +`
  //= `        ' dog.' ]`

  dump(String(diff).split(/\n/));
  //= `[ '@@ -1,5 +1,5 @@', ' The', '+fuzzy', ... 9 more items ]`
}


var util = require('util');


usageDemo.compactInspect = function (x) {
  return util.inspect(x, { maxArrayLength: 3 }
    ).replace(/(true,)(\n)/g, '$1 $2'
    ).replace(/\n(\s*)(?=(itemsA|startA):)/g, '\r$1'
    ).replace(/( \d+ more items,)\n/g, '$1\r'
    ).replace(/((?:[0-9a-z']|' \]|\[\]), *)\n\s+(?=[a-z])/g, '$1 '
    ).replace(/(\w\\n)/g, "$1' +\n        '"
    ).replace(/\r/g, '\n');
};


usageDemo.dumpTo = function (x) {
  x = usageDemo.compactInspect(x);
  if (!this) { return console.log(x); }
  this.push.apply(this, x.split(/\n/));
};



















module.exports = usageDemo;
if (require.main === module) { usageDemo(usageDemo.dumpTo.bind(null)); }