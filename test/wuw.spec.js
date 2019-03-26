/// <reference types='../lib/wuw'/>

/* eslint-env browser, mocha */
/* global assert, mock, loadWuw, wuw */

'use strict';

beforeEach
(
    async () =>
    {
        const _console_error            = mock();
        const _console_groupCollapsed   = mock();
        const _console_groupEnd         = mock();
        const _console_log              = mock();
        const _console_warn             = mock();
        const mocks =
        {
            console:
            {
                error:          _console_error,
                groupCollapsed: _console_groupCollapsed,
                groupEnd:       _console_groupEnd,
                log:            _console_log,
                warn:           _console_warn,
            },
        };
        const wuw = await loadWuw(mocks);
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

describe
(
    'wuw.reset',
    () =>
    {
        it
        (
            'has expected properties',
            () =>
            {
                assert.ownInclude(wuw.reset, { length: 0, name: 'reset' });
                assert.notProperty(wuw.reset, 'prototype');
            },
        );

        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.reset();
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'schedules for unwatching',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).reset();
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'resets remarkUndeletableProperties',
            () =>
            {
                wuw.remarkUndeletableProperties = Function();
                wuw.reset();
                assert.strictEqual
                (wuw.remarkUndeletableProperties, wuw.defaultRemarkUndeletableProperties);
            },
        );

        it
        (
            'uninstalls a callback',
            () =>
            {
                const callback = Function();
                wuw.do(callback).reset();
                const doing = wuw.isDoing(callback);
                assert.isFalse(doing);
            },
        );

        it
        (
            'clears the log',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                wuwTarget.textContent = 'foo';
                wuw.reset();
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'enables logging',
            () =>
            {
                wuw.loggingEnabled = false;
                wuw.reset();
                assert.isTrue(wuw.loggingEnabled);
            },
        );

        it
        (
            'resets maxLogLength',
            () =>
            {
                wuw.maxLogLength = 1;
                wuw.reset();
                assert.strictEqual(wuw.maxLogLength, wuw.defaultMaxLogLength);
            },
        );

        it
        (
            'disables live recording',
            () =>
            {
                wuw.live().reset();
                assert.isFalse(wuw.liveReportingEnabled);
            },
        );
    },
);
