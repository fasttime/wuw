/// <reference types='../lib/wuw'/>

/* eslint-env browser, mocha */
/* global CALLS, _console_log, assert, itAll, wuw */

'use strict';

describe
(
    'liveReporting',
    () => it('has expected properties', () => assert.hasConsistentOwnProperties(wuw.liveReporting)),
);

describe
(
    'live',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.live();
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'sets liveReportingEnabled',
            () =>
            {
                wuw.live();
                assert.isTrue(wuw.liveReportingEnabled);
            },
        );

        describe
        (
            'has expected properties as',
            () =>
            {
                const data =
                [
                    { live: wuw.live,               callerFullName: 'wuw.live' },
                    { live: wuw.liveReporting.live, callerFullName: 'wuw.liveReporting.live' },
                ];

                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ live }) =>
                    {
                        assert.ownInclude(live, { length: 0, name: 'live' });
                        assert.notProperty(live, 'prototype');
                    },
                );
            },
        );
    },
);

describe
(
    'unlive',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.unlive();
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'unsets liveReportingEnabled',
            () =>
            {
                wuw.unlive();
                assert.isFalse(wuw.liveReportingEnabled);
            },
        );

        describe
        (
            'has expected properties as',
            () =>
            {
                const data =
                [
                    {
                        unlive:         wuw.unlive,
                        callerFullName: 'wuw.unlive',
                    },
                    {
                        unlive:         wuw.liveReporting.unlive,
                        callerFullName: 'wuw.liveReporting.unlive',
                    },
                ];

                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ unlive }) =>
                    {
                        assert.ownInclude(unlive, { length: 0, name: 'unlive' });
                        assert.notProperty(unlive, 'prototype');
                    },
                );
            },
        );
    },
);

describe
(
    'liveReportingEnabled',
    () =>
    {
        it('is initially set to false', () => assert.isFalse(wuw.liveReportingEnabled));

        describe
        (
            'can be set to',
            () =>
            {
                const testData =
                [
                    { value: false,     expected: false },
                    { value: undefined, expected: false },
                    { value: 0,         expected: false },
                    { value: null,      expected: false },
                    { value: '',        expected: false },
                    { value: true,      expected: true },
                    { value: Symbol(),  expected: true },
                    { value: 42,        expected: true },
                    { value: { },       expected: true },
                    { value: 'foo',     expected: true },
                ];

                itAll
                (
                    testData,
                    ({ value }) => String(value),
                    ({ value, expected }) =>
                    {
                        wuw.liveReportingEnabled = value;
                        assert.strictEqual(wuw.liveReportingEnabled, expected);
                    },
                );
            },
        );
    },
);

describe
(
    'live reporting',
    () =>
    {
        it
        (
            'reports property sets',
            async () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).live();
                wuwTarget.innerText = 'foo';
                try
                {
                    wuwTarget.textContent = Symbol.species;
                }
                catch (error)
                { }
                await
                new Promise
                (
                    resolve =>
                    {
                        const intervalId =
                        setInterval
                        (
                            () =>
                            {
                                if (_console_log[CALLS].length)
                                {
                                    clearInterval(intervalId);
                                    resolve();
                                }
                            },
                        );
                    },
                );
                const calls =
                _console_log[CALLS].filter(({ args }) => /^%cwuw record\b/.test(args[0]));
                assert.lengthOf(calls, 2);
            },
        );
    },
);
