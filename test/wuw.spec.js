/* eslint-env browser, mocha */
/* global assert, mock, loadWuw, wuw */

'use strict';

beforeEach
(
    async () =>
    {
        const _console_error = mock();
        const _console_log = mock();
        const _console_warn = mock();
        const wuw = await loadWuw({ _console_error, _console_log, _console_warn });
        Object.defineProperties
        (
            self,
            {
                wuw: { configurable: true, value: wuw },
                _console_error: { configurable: true, value: _console_error },
                _console_log: { configurable: true, value: _console_log },
                _console_warn: { configurable: true, value: _console_warn },
            },
        );
    },
);

describe('wuw', () => it('has expected properties', () => assert.hasConsistentOwnProperties(wuw)));
