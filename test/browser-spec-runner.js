/* eslint-env browser */
/* global MochaBar, chai, mocha */

'use strict';

mocha.setup({ ignoreLeaks: false, reporter: MochaBar, ui: 'bdd' });
addEventListener('load', () => mocha.run());
const { assert } = chai;
