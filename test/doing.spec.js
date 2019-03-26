/// <reference types='../lib/wuw'/>

/* eslint-env browser, mocha */
/*
global
CALLS,
CHANGE_PROPERTY_STACK_TRACE_PATTERN,
_console_error,
assert,
changeProperty,
itAll,
mock,
wuw,
*/

'use strict';

describe
('doing', () => it('has expected properties', () => assert.hasConsistentOwnProperties(wuw.doing)));

describe
(
    'do',
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
            () =>
            {
                const expectedError = SyntaxError('bar');
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

            describe
            (
                'has expected properties as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ do: do_ }) =>
                    {
                        assert.ownInclude(do_, { length: 1, name: 'do' });
                        assert.notProperty(do_, 'prototype');
                    },
                ),
            );

            describe
            (
                'throws for missing argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ do: do_, callerFullName }) =>
                    assert.throws
                    (
                        () => do_(),
                        TypeError,
                        `Argument of ${callerFullName} is missing or undefined`,
                    ),
                ),
            );

            describe
            (
                'throws for invalid argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ do: do_, callerFullName }) =>
                    assert.throws
                    (
                        () => do_(Object.create(Function())),
                        TypeError,
                        `Argument of ${callerFullName} is not a function`,
                    ),
                ),
            );
        }
    },
);

describe
(
    'dont',
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

            describe
            (
                'has expected properties as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ dont }) =>
                    {
                        assert.ownInclude(dont, { length: 1, name: 'dont' });
                        assert.notProperty(dont, 'prototype');
                    },
                ),
            );

            describe
            (
                'throws for missing argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ dont, callerFullName }) =>
                    assert.throws
                    (
                        () => dont(),
                        TypeError,
                        `Argument of ${callerFullName} is missing or undefined`,
                    ),
                ),
            );

            describe
            (
                'throws for invalid argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ dont, callerFullName }) =>
                    assert.throws
                    (
                        () => dont(Object.create(Function())),
                        TypeError,
                        `Argument of ${callerFullName} is not a function`,
                    ),
                ),
            );
        }
    },
);

describe
(
    'doNothing',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.doNothing();
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
                wuw.doNothing();
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.isEmpty(callback[CALLS]);
            },
        );

        describe
        (
            'has expected properties as',
            () =>
            {
                const data =
                [
                    { doNothing: wuw.doNothing,         callerFullName: 'wuw.doNothing' },
                    { doNothing: wuw.doing.doNothing,   callerFullName: 'wuw.doing.doNothing' },
                ];

                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ doNothing }) =>
                    {
                        assert.ownInclude(doNothing, { length: 0, name: 'doNothing' });
                        assert.notProperty(doNothing, 'prototype');
                    },
                );
            },
        );
    },
);

describe
(
    'isDoing',
    () =>
    {
        it
        (
            'returns false',
            () =>
            {
                const callback = Function();
                const returnValue = wuw.isDoing(callback);
                assert.isFalse(returnValue);
            },
        );

        it
        (
            'returns true',
            () =>
            {
                const callback = Function();
                const returnValue = wuw.do(callback).isDoing(callback);
                assert.isTrue(returnValue);
            },
        );

        {
            const data =
            [
                { isDoing: wuw.isDoing,         callerFullName: 'wuw.isDoing' },
                { isDoing: wuw.doing.isDoing,   callerFullName: 'wuw.doing.isDoing' },
            ];

            describe
            (
                'has expected properties as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ isDoing }) =>
                    {
                        assert.ownInclude(isDoing, { length: 1, name: 'isDoing' });
                        assert.notProperty(isDoing, 'prototype');
                    },
                ),
            );

            describe
            (
                'throws for missing argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ isDoing, callerFullName }) =>
                    assert.throws
                    (
                        () => isDoing(),
                        TypeError,
                        `Argument of ${callerFullName} is missing or undefined`,
                    ),
                ),
            );

            describe
            (
                'throws for invalid argument as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ isDoing, callerFullName }) =>
                    assert.throws
                    (
                        () => isDoing(Object.create(Function())),
                        TypeError,
                        `Argument of ${callerFullName} is not a function`,
                    ),
                ),
            );
        }
    },
);
