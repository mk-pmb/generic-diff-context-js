/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var diffCtx = require('generic-diff-context'),
  lf = { no: '\\ ' + diffCtx.vocNoFinalLf, ch: ' ', a: [], b: [] },
  tu = require('./lib-test-util.js');

function par2nl(s) { return s.replace(/¶/g, '\n'); }
function splitLn(s) { return s.split(/¶|\n/); }


function e(a, b) {
  if (a === 0) { return 'skip'; }
  a = par2nl(a);
  b = (b === null ? a : par2nl(b));
  Array.prototype.slice.call(arguments, 2).forEach(function (spec) {
    if (!spec) { return; }
    var mode = spec.shift(), ctxLen = spec.shift(), t;
    if (!mode) { return; }
    t = (e.modes[mode].transformInput || String);
    ['', '\n'].forEach(function (addLfB) {
      lf.b[0] = (addLfB ? '' : lf.no);
      ['', '\n'].forEach(function (addLfA) {
        lf.a[0] = (addLfA ? '' : lf.no);
        var s, lfBits = (addLfA ? 1 : 0) + (addLfB ? 2 : 0),
          input = { a: t(a + addLfA), b: t(b + addLfB) };
        //console.error('\n\n' + mode + '+' + ctxLen, input, lfBits);
        s = [ diffCtx(input.a, input.b, { unified: ctxLen }) ];
        function add(x) {
          if ((x && typeof x) === 'object') {
            if (x.bits) { return add(x.bits[lfBits]); }
            if (x.eq || x.ne) { return add(addLfA === addLfB ? x.eq : x.ne); }
          }
          if (!x) { return; }
          if (x.forEach) { return x.forEach(add); }
          s = s.concat(x);
        }
        spec.forEach(add);
        tu.strLnEq(s.filter(Boolean));
      });
    });
  });
}
e.modes = { ln: { transformInput: splitLn }, ch: {}, };


e(0, 'both¶same',  null, ['ln', 1], ['ch', 4]);


e(0, 'foo¶bar',
  'foo¶baz',
  ['ln', 1, '@@ -1,2 +1,2 @@', ' foo',
    '-bar', lf.a,
    '+baz', lf.b ],
  ['ch', 4, '@@ -3,5 +3,5 @@', ' o', '^ba',
    '-r', lf.a,
    '+z', lf.b ]);

e('bar¶foo',
  'baz¶foo',
  ['ln', 1, '@@ -1,2 +1,2 @@',
    '-bar',
    '+baz',
    { eq: ' foo', ne: '-foo' }, lf.a,
    { ne: ['+foo', lf.b] } ],
  ['ch', 4, '@@ -1,7 +1,7 @@',
    ' ba',
    '-r',
    '+z',
    { eq: ' ', ne: '-' }, '^foo', lf.a,
    { ne: ['+', '^foo', lf.b] } ],
  ['ln', 0,
    { eq: '@@ -1 +1 @@', ne: '@@ -1,2 +1,2 @@' },
    '-bar', '+baz',
    { ne: ['-foo', lf.a, '+foo', lf.b] } ],
  ['ch', [1, 3],
    { eq: '@@ -2,5 +2,5 @@', ne: '@@ -2,6 +2,6 @@' },
    ' a', '-r', '+z',
    { eq: [' ', '^fo'],
      ne: ['-', '^foo', lf.a, '+', '^foo', lf.b] }
    ],
  0);



















/*scroll*/
