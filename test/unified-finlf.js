/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var diffCtx = require('generic-diff-context'),
  lf = { no: '\\ ' + diffCtx.vocNoFinalLf, ch: ' ', a: [], b: [] },
  tu = require('./lib-test-util.js');

function skip() { skip.ped = true; }
function par2nl(s) { return s.replace(/¶/g, '\n'); }
function splitLn(s) { return s.split(/¶|\n/); }


function uni(specs) {
  if (!specs) { return skip(); }
  specs = Array.prototype.slice.call(arguments, 0);
  if (!specs[specs.length - 1]) { specs.pop(); }
  specs.forEach(function (spec) {
    if (!spec) { return skip(); }
    var mode = spec.shift(), ctxLen = spec.shift(), t;
    if (!mode) { return skip(); }
    t = (uni.modes[mode].transformInput || String);
    ['', '\n'].forEach(function (addLfB) {
      lf.b[0] = (addLfB ? '' : lf.no);
      ['', '\n'].forEach(function (addLfA) {
        lf.a[0] = (addLfA ? '' : lf.no);
        var s, lfBits = (addLfA ? 1 : 0) + (addLfB ? 2 : 0),
          input = { a: t(uni.a + addLfA), b: t(uni.b + addLfB) };
        //console.error('\n\n' + mode + '+' + ctxLen, input, lfBits);
        s = [ diffCtx(input.a, input.b, { unified: ctxLen }) ];
        function add(x) {
          if ((x && typeof x) === 'object') {
            if (x['b' + lfBits] !== undefined) { return add(x['b' + lfBits]); }
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
uni.modes = { ln: { transformInput: splitLn }, ch: {}, };
uni.vs = function (a, b) {
  uni.a = par2nl(a);
  uni.b = (b === undefined ? uni.a : par2nl(b));
};



uni.vs('foo¶bar¶baz¶qux');
uni(['ln', 1, { ne: [
  '@@ -3,2 +3,2 @@', ' baz',
  '-qux', lf.a, '+qux', lf.b,
] }]);
uni(['ch', 4, { ne: [
  '@@ -11,5 +11,5 @@', ' z', '^qu',
  '-x', lf.a, '+x', lf.b,
] }]);


uni.vs('foo¶bar',
     'foo¶baz');
uni(['ln', 1, '@@ -1,2 +1,2 @@', ' foo',
  '-bar', lf.a,
  '+baz', lf.b ]);
uni(['ch', 4, '@@ -3,5 +3,5 @@', ' o', '^ba',
  '-r', lf.a,
  '+z', lf.b ]);

uni.vs('bar¶foo',
     'baz¶foo');
uni(['ln', 1, '@@ -1,2 +1,2 @@',
  '-bar',
  '+baz',
  { eq: ' foo', ne: '-foo' }, lf.a,
  { ne: ['+foo', lf.b] } ]);
uni(['ch', 4, '@@ -1,7 +1,7 @@',
  ' ba',
  '-r',
  '+z',
  { eq: [ ' ', '^foo', lf.a ],
    ne: [ ' ', '^fo',
          '-o', lf.a,
          '+o', lf.b ]
    } ]);
uni(['ln', 0,
  { eq: '@@ -1 +1 @@', ne: '@@ -1,2 +1,2 @@' },
  '-bar', '+baz',
  { ne: ['-foo', lf.a, '+foo', lf.b] } ]);
uni(['ch', [1, 3],
  { eq: '@@ -2,5 +2,5 @@', ne: '@@ -2,6 +2,6 @@' },
  ' a',
  '-r',
  '+z',
  ' ', '^fo',
  { ne: [ '-o', lf.a,
          '+o', lf.b, ],
    },
  ]);


uni.vs("hello¶  world¶  how  ¶\tdo you¶do?");
uni(['ln', 2,
  { ne: [ '@@ -3,3 +3,3 @@',
      '   how  ',
      ' \tdo you',
      '-do?', lf.a,
      '+do?', lf.b,
      ] },
  ]);





















if (skip.ped) { throw new Error('Some tests were skipped.'); }
