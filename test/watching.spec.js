/// <reference types='../lib/wuw'/>

/* eslint-env browser, mocha */
/*
global
CALLS,
CHANGE_PROPERTY_STACK_TRACE_PATTERN,
REFLECT_CHANGE_PROPERTY_STACK_TRACE_PATTERN,
_console_warn,
assert,
changeProperty,
itAll,
mock,
reflectChangeProperty,
wuw,
*/

'use strict';

describe
(
    'watching',
    () => it('has expected properties', () => assert.hasConsistentOwnProperties(wuw.watching)),
);

describe
(
    'watch',
    () =>
    {
        it
        (
            'returns wuw with an unwatched target',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                const returnValue = wuw.watch(wuwTarget);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'returns wuw with a watched target',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                const returnValue = wuw(wuwTarget).watch(wuwTarget);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'strips own properties',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                wuwTarget.foo = 'bar';
                wuwTarget[Symbol.species] = 'baz';
                wuw.watch(wuwTarget);
                assert.empty(Object.getOwnPropertyNames(wuwTarget));
                assert.empty(Object.getOwnPropertySymbols(wuwTarget));
                assert.propertyVal(wuwTarget, 'foo', 'bar');
                assert.propertyVal(wuwTarget, Symbol.species, 'baz');
            },
        );

        it
        (
            'warns about undeletable own properties',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                Object.defineProperties
                (
                    wuwTarget,
                    {
                        [Symbol.species]: { value: undefined, writable: true },
                        foo: { value: undefined, writable: true },
                    },
                );
                const remarkUndeletableProperties1 = wuw.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                assert.deepEqual
                (
                    remarkUndeletableProperties1[CALLS],
                    [{ args: [wuwTarget, ['foo', Symbol.species]], this: undefined }],
                );
                wuw.unwatchAll();
                const remarkUndeletableProperties2 = wuw.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                assert.deepEqual
                (
                    remarkUndeletableProperties2[CALLS],
                    [{ args: [wuwTarget, ['foo', Symbol.species]], this: undefined }],
                );
            },
        );

        {
            const data =
            [
                {
                    watch:          wuw,
                    name:           'wuw',
                    callerFullName: 'wuw',
                },
                {
                    watch:          wuw.watch,
                    name:           'watch',
                    callerFullName: 'wuw.watch',
                },
                {
                    watch:          wuw.watching.watch,
                    name:           'watch',
                    callerFullName: 'wuw.watching.watch',
                },
            ];

            describe
            (
                'has expected properties as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ watch, name }) =>
                    {
                        assert.ownInclude(watch, { length: 1, name });
                        assert.notProperty(watch, 'prototype');
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
                    ({ watch, callerFullName }) =>
                    assert.throws
                    (
                        () => watch(),
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
                    ({ watch, callerFullName }) =>
                    {
                        const wuwTarget = Object.create(document.createElement('DATA'));
                        assert.throws
                        (
                            () => watch(wuwTarget),
                            TypeError,
                            `Argument of ${callerFullName} does not implement interface Node`,
                        );
                    },
                ),
            );
        }
    },
);

describe
(
    'unwatch',
    () =>
    {
        it
        (
            'returns wuw with an unwatched target',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                const returnValue = wuw.unwatch(wuwTarget);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'returns wuw with a watched target',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                const returnValue = wuw(wuwTarget).unwatch(wuwTarget);
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'unstrips own properties',
            () =>
            {
                const wuwTarget = document.createTextNode('');
                wuwTarget[0] = 'foo';
                wuwTarget[1] = 'bar';
                wuwTarget[Symbol.species] = 'baz';
                wuw.watch(wuwTarget);
                Object.defineProperty(wuwTarget, 0, { value: 'foobar' });
                wuw.unwatch(wuwTarget);
                assert.propertyVal(wuwTarget, 1, 'bar');
                assert.propertyVal(wuwTarget, Symbol.species, 'baz');
            },
        );

        {
            const data =
            [
                { unwatch: wuw.unwatch,             callerFullName: 'wuw.unwatch' },
                { unwatch: wuw.watching.unwatch,    callerFullName: 'wuw.watching.unwatch' },
            ];

            describe
            (
                'has expected properties as',
                () =>
                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ unwatch }) =>
                    {
                        assert.ownInclude(unwatch, { length: 1, name: 'unwatch' });
                        assert.notProperty(unwatch, 'prototype');
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
                    ({ unwatch, callerFullName }) =>
                    assert.throws
                    (
                        () => unwatch(),
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
                    ({ unwatch, callerFullName }) =>
                    {
                        const wuwTarget = Object.create(document.createElement('DATA'));
                        assert.throws
                        (
                            () => unwatch(wuwTarget),
                            TypeError,
                            `Argument of ${callerFullName} does not implement interface Node`,
                        );
                    },
                ),
            );
        }
    },
);

describe
(
    'unwatchAll',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.unwatchAll();
                assert.strictEqual(returnValue, wuw);
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
                        unwatchAll:     wuw.unwatchAll,
                        callerFullName: 'wuw.unwatchAll',
                    },
                    {
                        unwatchAll:     wuw.watching.unwatchAll,
                        callerFullName: 'wuw.watching.unwatchAll',
                    },
                ];

                itAll
                (
                    data,
                    ({ callerFullName }) => callerFullName,
                    ({ unwatchAll }) =>
                    {
                        assert.ownInclude(unwatchAll, { length: 0, name: 'unwatchAll' });
                        assert.notProperty(unwatchAll, 'prototype');
                    },
                );
            },
        );
    },
);

describe
(
    'defaultRemarkUndeletableProperties',
    () =>
    {
        it
        (
            'is read-only',
            () =>
            {
                assert.throws
                (
                    () =>
                    {
                        wuw.defaultRemarkUndeletableProperties = null;
                    },
                    TypeError,
                );
            },
        );

        it
        (
            'has expected properties',
            () =>
            {
                assert.ownInclude
                (
                    wuw.defaultRemarkUndeletableProperties,
                    { length: 2, name: 'remarkUndeletableProperties' },
                );
                assert.notProperty(wuw.defaultRemarkUndeletableProperties, 'prototype');
            },
        );

        describe
        (
            'warns about',
            () =>
            {
                const data =
                [
                    {
                        description:            'one property',
                        propertyKeys:           ['foo'],
                        formattedPropertyKeys:  '"foo"',
                    },
                    {
                        description:            'two properties',
                        propertyKeys:           [Symbol('foo'), 'bar'],
                        formattedPropertyKeys:  '"bar" and Symbol(foo)',
                    },
                    {
                        description:            'three properties',
                        propertyKeys:           [Symbol('foo'), 'bar', 42],
                        formattedPropertyKeys:  '"42", "bar", and Symbol(foo)',
                    },
                ];

                itAll
                (
                    data,
                    ({ description }) => description,
                    ({ propertyKeys, formattedPropertyKeys }) =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        propertyKeys.forEach
                        (
                            propertyKey =>
                            Object.defineProperty(wuwTarget, propertyKey, { value: undefined }),
                        );
                        wuw(wuwTarget);
                        assert.deepEqual
                        (
                            _console_warn[CALLS],
                            [
                                {
                                    args:
                                    [
                                        'The target object %o has undeletable properties: %s',
                                        wuwTarget,
                                        formattedPropertyKeys,
                                    ],
                                    this: undefined,
                                },
                            ],
                        );
                    },
                );
            },
        );
    },
);

describe
(
    'remarkUndeletableProperties',
    () =>
    {
        it
        (
            'is initially set to defaultRemarkUndeletableProperties',
            () =>
            {
                assert.strictEqual
                (wuw.remarkUndeletableProperties, wuw.defaultRemarkUndeletableProperties);
            },
        );

        it
        (
            'can be set to a function',
            () =>
            {
                const remarkUndeletableProperties = Function();
                wuw.remarkUndeletableProperties = remarkUndeletableProperties;
                assert.strictEqual(wuw.remarkUndeletableProperties, remarkUndeletableProperties);
            },
        );

        it
        (
            'can be set to null by null',
            () =>
            {
                wuw.remarkUndeletableProperties = null;
                assert.isNull(wuw.remarkUndeletableProperties);
            },
        );

        it
        (
            'can be set to null by undefined',
            () =>
            {
                wuw.remarkUndeletableProperties = undefined;
                assert.isNull(wuw.remarkUndeletableProperties);
            },
        );

        it
        (
            'cannot be set to a non-function',
            () =>
            {
                assert.throws
                (
                    () =>
                    {
                        wuw.remarkUndeletableProperties = { };
                    },
                    TypeError,
                    'remarkUndeletableProperties must be a function, undefined or null',
                );
            },
        );
    },
);

describe
(
    'watching',
    () =>
    {
        it
        (
            'records a successful property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                changeProperty(wuwTarget, 'textContent');
                const expectedEndTime = performance.now();
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: wuwTarget, propertyKey: 'textContent', success: true });
                assert.notProperty(record, 'error');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                assert.equal(wuwTarget.textContent, 'lorem ipsum');
            },
        );

        it
        (
            'records a failed read-only data property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                const success = reflectChangeProperty(wuwTarget, 'TEXT_NODE');
                assert.isFalse(success);
                const expectedEndTime = performance.now();
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: wuwTarget, propertyKey: 'TEXT_NODE', success: false });
                assert.notProperty(record, 'error');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, REFLECT_CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                assert.notEqual(wuwTarget.TEXT_NODE, 'lorem ipsum');
            },
        );

        it
        (
            'records a failed read-only accessor property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                let error;
                try
                {
                    changeProperty(wuwTarget, 'textContent', Symbol.species);
                }
                catch (errorCaught)
                {
                    error = errorCaught;
                }
                const expectedEndTime = performance.now();
                assert.instanceOf(error, TypeError);
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude(record, { target: wuwTarget, propertyKey: 'textContent', error });
                assert.notProperty(record, 'success');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
            },
        );

        it
        (
            'does not record a property set after unwatching',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).unwatch(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'does not record a property set after scheduling for unwatching',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).unwatchAll();
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).watch(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(wuw.log, 1);
            },
        );

        it
        (
            'does not target an inheritor',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const inheritor = Object.create(wuwTarget);
                void inheritor.foo;
                inheritor.foo = 'bar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'warns about undeletable own properties',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                const remarkUndeletableProperties1 = wuw.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                Object.defineProperty(wuwTarget, 'foo', { value: undefined, writable: true });
                wuwTarget.foobar = 'FOO';
                assert.deepEqual
                (
                    remarkUndeletableProperties1[CALLS],
                    [{ args: [wuwTarget, ['foo']], this: undefined }],
                );
                Object.defineProperties
                (
                    wuwTarget,
                    {
                        [Symbol.species]: { value: undefined, writable: true },
                        bar: { value: undefined, writable: true },
                    },
                );
                const remarkUndeletableProperties2 = wuw.remarkUndeletableProperties = mock();
                wuwTarget.foobar = 'BAR';
                assert.deepEqual
                (
                    remarkUndeletableProperties2[CALLS],
                    [{ args: [wuwTarget, ['bar', Symbol.species]], this: undefined }],
                );
            },
        );
    },
);

describe
(
    'spying',
    () =>
    {
        it
        (
            'records a successful property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                const spyTarget = wuwTarget.style;
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                changeProperty(wuwTarget.style, 'display', 'none');
                const expectedEndTime = performance.now();
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: spyTarget, propertyKey: 'display', success: true });
                assert.notProperty(record, 'error');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                assert.equal(wuwTarget.style.display, 'none');
            },
        );

        it
        (
            'records a failed read-only data property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                const spyTarget = wuwTarget.style;
                Object.defineProperty
                (spyTarget, 'foo', { configurable: true, value: 'bar', writable: false });
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                const success = reflectChangeProperty(wuwTarget.style, 'foo');
                assert.isFalse(success);
                const expectedEndTime = performance.now();
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: spyTarget, propertyKey: 'foo', success: false });
                assert.notProperty(record, 'error');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, REFLECT_CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                assert.notEqual(wuwTarget.style, 'lorem ipsum');
            },
        );

        it
        (
            'records a failed read-only accessor property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                const spyTarget = wuwTarget.style;
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                let error;
                try
                {
                    changeProperty(wuwTarget.style, 'display', Symbol.species);
                }
                catch (errorCaught)
                {
                    error = errorCaught;
                }
                const expectedEndTime = performance.now();
                assert.instanceOf(error, TypeError);
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude(record, { target: spyTarget, propertyKey: 'display', error });
                assert.notProperty(record, 'success');
                assert.timeRange
                (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
            },
        );

        it
        (
            'does not record a property set after unspying',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const { style: spy } = wuwTarget;
                wuw.unwatch(wuwTarget);
                spy.display = 'none';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'does not record a property set after scheduling for unwatching',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const { style: spy } = wuwTarget;
                wuw.unwatchAll();
                spy.display = 'none';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const expectedStyle = wuwTarget.style;
                const actualStyle = wuwTarget.style;
                expectedStyle.display = 'none';
                assert.strictEqual(actualStyle, expectedStyle);
                assert.lengthOf(wuw.log, 1);
            },
        );

        it
        (
            'does not target after scheduling for unwatching',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).unwatchAll();
                wuwTarget.style.foo = 'bar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'does not target an inheritor',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const inheritor = Object.create(wuwTarget.style);
                void inheritor.foo;
                inheritor.foo = 'bar';
                assert.lengthOf(wuw.log, 0);
            },
        );

        it
        (
            'does not target an invalid style object',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                const expectedStyle = Object.create(wuwTarget.style);
                Object.defineProperty
                (wuwTarget, 'style', { configurable: true, value: expectedStyle });
                wuw.watch(wuwTarget);
                const actualStyle = wuwTarget.style;
                assert.strictEqual(actualStyle, expectedStyle);
                assert.lengthOf(wuw.log, 0);
            },
        );
    },
);
