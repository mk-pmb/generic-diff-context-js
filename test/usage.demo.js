/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

function usageDemo(dump) {
  var genDiffCtx = require('generic-diff-context'), a, b, opt, diff;

  a = "hello world";
  b = "help arnold";
  dump(genDiffCtx(a, b));
  //= `[ { added: false, removed: false, sign: ' ',`
  //= `    a: { items: 'hel', start: 0 }, b: { items: 'hel', start: 0 } },`
  //= `  { added: false, removed: true,  sign: '-',`
  //= `    a: { items: 'lo', start: 3 }, b: { items: '', start: 3 } },`
  //= `  { added: true,  removed: false, sign: '+',`
  //= `    a: { items: '', start: 5 }, b: { items: 'p', start: 3 } },`
  //= `  ... 6 more items,`
  //= `  a: { len: 11, lastPart: 8 }, b: { len: 11, lastPart: 8 },`
  //= `  glue: '' ]`


  function toWords(s) { return s.split(/\s+/); }

  a = toWords("The       quick brown fox    jumps over the lazy dog.");
  b = toWords("The fuzzy quick       kitten jumps over the      dog.");
  diff = genDiffCtx(a, b);
  dump(diff);
  //= `[ { added: false, removed: false, sign: ' ',`
  //= `    a: { items: [Object], start: 0 },`
  //= `    b: { items: [Object], start: 0 } },`
  //= `  { added: true,  removed: false, sign: '+',`
  //= `    a: { items: [], start: 1 },`
  //= `    b: { items: [Object], start: 1 } },`
  //= `  { added: false, removed: false, sign: ' ',`
  //= `    a: { items: [Object], start: 1 },`
  //= `    b: { items: [Object], start: 2 } },`
  //= `  ... 5 more items,`
  //= `  a: { len: 9, lastPart: 7 }, b: { len: 8, lastPart: 7 },`
  //= `  glue: false ]`

  a = toWords("The       quick brown fox    jumps over the lazy dog.");
  b = toWords("The fuzzy quick       kitten jumps over the      dog.");
  opt = { unified: 1 };
  diff = genDiffCtx(a, b, opt);

  dump(diff);
  //= `[ [ [ ' ', 'The' ],`
  //= `    [ '+', 'fuzzy' ],`
  //= `    [ ' ', 'quick' ],`
  //= `    ... 4 more items,`
  //= `    a: { start: 0, len: 5 },`
  //= `    b: { start: 0, len: 5 } ],`
  //= `  [ [ ' ', 'the' ],`
  //= `    [ '-', 'lazy' ],`
  //= `    [ ' ', 'dog.' ],`
  //= `    a: { start: 6, len: 3 },`
  //= `    b: { start: 6, len: 2 } ],`
  //= `  a: { len: 9, lastPart: 1, finalLf: false },`
  //= `  b: { len: 8, lastPart: 1, finalLf: false } ]`

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


usageDemo.compact = function (func, obj) {
  if (obj) { func = obj[func].bind(obj); }
  usageDemo(function (x) { func(usageDemo.compactInspect(x));  });
  return obj;
};


usageDemo.compactInspect = function (x) {
  return util.inspect(x, { maxArrayLength: 3 }
    ).replace(/(true,)(\n)/g, '$1 $2'
    ).replace(/\n(\s*)(?=[ab]:)/g, '\r$1'
    ).replace(/( \d+ more items,)\n/g, '$1\r'
    ).replace(/((?:[0-9a-z']|' \]|\[\]), *)\n\s+(?=[a-z])/g, '$1 '
    ).replace(/(\w\\n)/g, "$1' +\n        '"
    ).replace(/\r\s*(?=b:[ -~]{0,30}\},\n)/g, ' '
    ).replace(/\r/g, '\n');
};


usageDemo.capture = function () {
  var output = [];
  function dumpInspect(x) {
    output.push.apply(output, x.split(/\n/));
  }
  usageDemo.compact(dumpInspect);
  return output;
};


usageDemo.expectedOutput = (function () {
  var expected = [];
  String(usageDemo).replace(/\n\s*\/{2}=\s*`([ -~]*)`(?=\n)/g,
    function (m, exln) { expected.push(m && exln); });
  return expected;
}());


usageDemo.compare = function (cmp) {
  return cmp(usageDemo.capture(), usageDemo.expectedOutput);
};















module.exports = usageDemo;
if (require.main === module) { usageDemo.compact('log', console); }
