/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

require('usnam-pmb');

var diffCtx = require('generic-diff-context'), a, b, opt = { finalLf: true },
  tu = require('./lib-test-util.js');

a = b = '';
opt.unified = 9009;
tu.arrEq([diffCtx(a, b, opt).map(String)]);

a = b = 'Hello';
opt.unified = 9009;
tu.arrEq([diffCtx(a, b, opt).map(String)]);

b += 'World';
tu.arrEq([diffCtx(a, b, opt).map(String), [
  '@@ -1,5 +1,10 @@',
  ' Hello',
  '+World',
  '\\ ¬¶',
].join('\n')]);
















/*scroll*/
