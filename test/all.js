/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var tu = require('./lib-test-util.js');

require('./basics.js');
require('./unified-chars.js');
require('./unified-finlf.js');
require('./unified-words.js');

require('./usage.demo.js').compare(tu.arrEq);














console.log('+OK all tests passed.');
