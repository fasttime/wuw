/* eslint-env browser */
/* global MochaBar, chai, mocha */

'use strict';

mocha.setup
({ globals: ['$0', '$1', '$2', '$3', '$4'], ignoreLeaks: false, reporter: MochaBar, ui: 'bdd' });
addEventListener('load', () => mocha.run());
const { assert } = chai;
