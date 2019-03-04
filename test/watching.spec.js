/* eslint-env browser, mocha */
/*
global
CALLS,
CHANGE_PROPERTY_STACK_TRACE_PATTERN,
REFLECT_CHANGE_PROPERTY_STACK_TRACE_PATTERN,
assert,
changeProperty,
mock,
reflectChangeProperty,
wuw,
*/

'use strict';

describe
(
    'watching',
    () =>
    {
        it
        (
            'has expected properties',
            () =>
            {
                assert.hasConsistentOwnProperties(wuw.watching);
            },
        );
    },
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
                wuw.watch(wuwTarget);
                assert.empty(Object.getOwnPropertyDescriptors(wuwTarget));
                assert.propertyVal(wuwTarget, 'foo', 'bar');
            },
        );

        it
        (
            'warns about undeletable own properties',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                Object.defineProperty(wuwTarget, 'foo', { value: 42, writable: true });
                const remarkUndeletableProperties1 = wuw.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                assert.deepEqual
                (
                    remarkUndeletableProperties1[CALLS],
                    [{ args: [wuwTarget, ['foo']], this: undefined }],
                );
                wuw.unwatchAll();
                const remarkUndeletableProperties2 = wuw.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                assert.deepEqual
                (
                    remarkUndeletableProperties2[CALLS],
                    [{ args: [wuwTarget, ['foo']], this: undefined }],
                );
            },
        );

        {
            const data =
            [
                {
                    watch: wuw,
                    name: 'wuw',
                    callerFullName: 'wuw',
                },
                {
                    watch: wuw.watch,
                    name: 'watch',
                    callerFullName: 'wuw.watch',
                },
                {
                    watch: wuw.watching.watch,
                    name: 'watch',
                    callerFullName: 'wuw.watching.watch',
                },
            ];
            for (const { watch, name, callerFullName } of data)
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
                                assert.ownInclude(watch, { length: 1, name });
                                assert.notProperty(watch, 'prototype');
                            },
                        );

                        it
                        (
                            'throws for missing argument',
                            () =>
                            {
                                assert.throws
                                (
                                    () => watch(),
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
                                const wuwTarget = Object.create(document.createElement('DATA'));
                                assert.throws
                                (
                                    () => watch(wuwTarget),
                                    TypeError,
                                    `Argument of ${callerFullName} does not implement interface ` +
                                    'Node',
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
                wuw.watch(wuwTarget);
                Object.defineProperty(wuwTarget, 0, { value: 'baz' });
                wuw.unwatch(wuwTarget);
                assert.ownInclude(wuwTarget, { 1: 'bar' });
            },
        );

        const data =
        [
            { unwatch: wuw.unwatch,             callerFullName: 'wuw.unwatch' },
            { unwatch: wuw.watching.unwatch,    callerFullName: 'wuw.watching.unwatch' },
        ];
        for (const { unwatch, callerFullName } of data)
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
                            assert.ownInclude(unwatch, { length: 1, name: 'unwatch' });
                            assert.notProperty(unwatch, 'prototype');
                        },
                    );

                    it
                    (
                        'throws for missing argument',
                        () =>
                        {
                            assert.throws
                            (
                                () => unwatch(),
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
                            const wuwTarget = Object.create(document.createElement('DATA'));
                            assert.throws
                            (
                                () => unwatch(wuwTarget),
                                TypeError,
                                `Argument of ${callerFullName} does not implement interface Node`,
                            );
                        },
                    );
                },
            );
        }
    },
);

describe
(
    'watching',
    () =>
    {
        beforeEach(() => wuw.clear());

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
                const expectedError = SyntaxError('foo');
                const wuwTarget = document.createElement('DATA');
                Object.defineProperty
                (
                    wuwTarget,
                    'foo',
                    { // eslint-disable-line accessor-pairs
                        configurable: true,
                        set:
                        () =>
                        {
                            throw expectedError;
                        },
                    },
                );
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                let actualError;
                try
                {
                    changeProperty(wuwTarget, 'foo');
                }
                catch (error)
                {
                    actualError = error;
                }
                const expectedEndTime = performance.now();
                assert.strictEqual(actualError, expectedError);
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: wuwTarget, propertyKey: 'foo', error: expectedError });
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                Object.defineProperty(wuwTarget, 'foo', { value: 42, writable: true });
                wuwTarget.foobar = 'FOO';
                assert.deepEqual
                (
                    remarkUndeletableProperties1[CALLS],
                    [{ args: [wuwTarget, ['foo']], this: undefined }],
                );
                Object.defineProperty(wuwTarget, 'bar', { value: 42, writable: true });
                Object.defineProperty(wuwTarget, 'baz', { value: 42, writable: true });
                const remarkUndeletableProperties2 = wuw.remarkUndeletableProperties = mock();
                wuwTarget.foobar = 'BAR';
                assert.deepEqual
                (
                    remarkUndeletableProperties2[CALLS],
                    [{ args: [wuwTarget, ['bar', 'baz']], this: undefined }],
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
        beforeEach(() => wuw.clear());

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
                const expectedError = SyntaxError('bar');
                const wuwTarget = document.createElement('DATA');
                const spyTarget = wuwTarget.style;
                Object.defineProperty
                (
                    spyTarget,
                    'foo',
                    { // eslint-disable-line accessor-pairs
                        configurable: true,
                        set:
                        () =>
                        {
                            throw expectedError;
                        },
                    },
                );
                wuw.watch(wuwTarget);
                const expectedStartTime = performance.now();
                let actualError;
                try
                {
                    changeProperty(wuwTarget.style, 'foo');
                }
                catch (error)
                {
                    actualError = error;
                }
                const expectedEndTime = performance.now();
                assert.strictEqual(actualError, expectedError);
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
                const [record] = snapshot;
                assert.ownInclude
                (record, { target: spyTarget, propertyKey: 'foo', error: expectedError });
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.lengthOf(snapshot, 1);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
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
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
            },
        );
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

        const data =
        [
            { unwatchAll: wuw.unwatchAll,           callerFullName: 'wuw.unwatchAll' },
            { unwatchAll: wuw.watching.unwatchAll,  callerFullName: 'wuw.watching.unwatchAll' },
        ];
        for (const { unwatchAll, callerFullName } of data)
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
                            assert.ownInclude(unwatchAll, { length: 0, name: 'unwatchAll' });
                            assert.notProperty(unwatchAll, 'prototype');
                        },
                    );
                },
            );
        }
    },
);
