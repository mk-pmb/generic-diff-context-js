/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var diffCtx = require('generic-diff-context'),
  noLf = '\\ ' + diffCtx.vocNoFinalLf,
  tu = require('./lib-test-util.js');


function parSpl(s) { return s.split(/¶/); }
function par2nl(s) { return s.replace(/¶/g, '\n'); }

function t(a, b, x, y) {
  if (b === null) { b = a; }
  function p(f, u) { return diffCtx(f(a), f(b), { unified: u[0] }); }
  x[0] = p(parSpl, x);
  tu.strLnEq(x);
  y[0] = p(par2nl, y);
  tu.strLnEq(y);
}


t('foo¶bar',  null, [1], [4]);
t('foo¶bar¶', null, [1], [4]);


t('foo¶bar',
  'foo¶baz',
  [1, '@@ -1,2 +1,2 @@', ' foo',
    '-bar', noLf,
    '+baz', noLf ],
  [4, '@@ -3,5 +3,5 @@', ' o', '^ba',
    '-r', noLf,
    '+z', noLf ]);

t('foo¶bar¶',
  'foo¶baz',
  [1, '@@ -1,2 +1,2 @@', ' foo',
    '-bar',
    '+baz', noLf ],
  [4, '@@ -3,5 +3,5 @@', ' o', '^ba',
    '-r',
    '+z', noLf ]);

t('foo¶bar',
  'foo¶baz¶',
  [1, '@@ -1,2 +1,2 @@', ' foo',
    '-bar', noLf,
    '+baz' ],
  [4, '@@ -3,5 +3,5 @@', ' o', '^ba',
    '-r', noLf,
    '+z' ]);

t('foo¶bar¶',
  'foo¶baz¶',
  [1, '@@ -1,2 +1,2 @@', ' foo',
    '-bar',
    '+baz' ],
  [4, '@@ -3,5 +3,5 @@', ' o', '^ba',
    '-r',
    '+z' ]);


















/*scroll*/
