/* eslint-env browser, mocha */
/* global CALLS, CHANGE_PROPERTY_STACK_TRACE_PATTERN, assert, changeProperty, loadWuw, mock, wuw */

'use strict';

describe
(
    'doing',
    () =>
    {
        it
        (
            'has expected properties',
            () =>
            {
                assert.hasConsistentOwnProperties(wuw.doing);
            },
        );
    },
);

describe
(
    'wuw.do',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const callback = Function();
                const returnValue = wuw.do(callback);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'installs a callback only once',
            () =>
            {
                const callback = mock();
                wuw.do(callback);
                wuw.do(callback);
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(callback[CALLS], 1);
            },
        );

        it
        (
            'works as expected',
            async () =>
            {
                const expectedError = SyntaxError('bar');
                const _console_error = mock();
                const wuw = await loadWuw({ _console_error });
                wuw.do
                (
                    () =>
                    {
                        throw expectedError;
                    },
                );
                const callback = mock();
                wuw.do(callback);
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                const expectedStartTime = performance.now();
                changeProperty(wuwTarget, 'textContent');
                const expectedEndTime = performance.now();
                assert.deepEqual(_console_error[CALLS][0].args, [expectedError]);
                const [record] = callback[CALLS][0].args;
                assert.ownInclude
                (record, { target: wuwTarget, propertyKey: 'textContent', success: true });
                assert.notProperty(record, 'error');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                assert.equal(wuwTarget.textContent, 'lorem ipsum');
            },
        );

        {
            const data =
            [
                { do: wuw.do,       callerFullName: 'wuw.do' },
                { do: wuw.doing.do, callerFullName: 'wuw.doing.do' },
            ];
            for (const { do: do_, callerFullName } of data)
            {
                describe
                (
                    callerFullName,
                    () =>
                    {
                        it
                        (
                            'has expected properties',
                            () =>
                            {
                                assert.ownInclude(do_, { length: 1, name: 'do' });
                                assert.notProperty(do_, 'prototype');
                            },
                        );

                        it
                        (
                            'throws for missing argument',
                            () =>
                            {
                                assert.throws
                                (
                                    () => do_(),
                                    TypeError,
                                    `Argument of ${callerFullName} is missing or undefined`,
                                );
                            },
                        );

                        it
                        (
                            'throws for invalid argument',
                            () =>
                            {
                                assert.throws
                                (
                                    () => do_(Object.create(Function())),
                                    TypeError,
                                    `Argument of ${callerFullName} is not a function`,
                                );
                            },
                        );
                    },
                );
            }
        }
    },
);

describe
(
    'wuw.dont',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const callback = Function();
                const returnValue = wuw.dont(callback);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.dont(Function());
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'works as expected',
            () =>
            {
                const callback = mock();
                wuw.do(callback);
                wuw.dont(callback);
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.isEmpty(callback[CALLS]);
            },
        );

        {
            const data =
            [
                { dont: wuw.dont,       callerFullName: 'wuw.dont' },
                { dont: wuw.doing.dont, callerFullName: 'wuw.doing.dont' },
            ];
            for (const { dont, callerFullName } of data)
            {
                describe
                (
                    callerFullName,
                    () =>
                    {
                        it
                        (
                            'has expected properties',
                            () =>
                            {
                                assert.ownInclude(dont, { length: 1, name: 'dont' });
                                assert.notProperty(dont, 'prototype');
                            },
                        );

                        it
                        (
                            'throws for missing argument',
                            () =>
                            {
                                assert.throws
                                (
                                    () => dont(),
                                    TypeError,
                                    `Argument of ${callerFullName} is missing or undefined`,
                                );
                            },
                        );

                        it
                        (
                            'throws for invalid argument',
                            () =>
                            {
                                assert.throws
                                (
                                    () => dont(Object.create(Function())),
                                    TypeError,
                                    `Argument of ${callerFullName} is not a function`,
                                );
                            },
                        );
                    },
                );
            }
        }
    },
);
