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
            'returns wuw',
            () =>
            {
                const returnValue = wuw.watch(document.createTextNode(''));
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                wuw.watch(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.strictEqual
                (
                    Object.getPrototypeOf(Object.getPrototypeOf(wuwTarget)),
                    HTMLDataElement.prototype,
                );
            },
        );

        const data =
        [
            { watch: wuw,                   name: 'wuw',    fullName: 'wuw' },
            { watch: wuw.watch,             name: 'watch',  fullName: 'wuw.watch' },
            { watch: wuw.watching.watch,    name: 'watch',  fullName: 'wuw.watching.watch' },
        ];
        for (const { watch, name, fullName } of data)
        {
            describe
            (
                fullName,
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
                                `Argument of ${fullName} is missing or undefined`,
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
                                `Argument of ${fullName} does not implement interface Node`,
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
    'wuw targeting',
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
                Object.defineProperty(wuwTarget, 'foo', { value: 42, writable: true });
                const remarkUndeletableProperties =
                wuw.watching.remarkUndeletableProperties = mock();
                wuw.watch(wuwTarget);
                assert.lengthOf(remarkUndeletableProperties[CALLS], 1);
                wuwTarget.foobar = 'FOO';
                assert.lengthOf(remarkUndeletableProperties[CALLS], 1);
                Object.defineProperty(wuwTarget, 'bar', { value: 42, writable: true });
                Object.defineProperty(wuwTarget, 'baz', { value: 42, writable: true });
                wuwTarget.foobar = 'BAR';
                assert.lengthOf(remarkUndeletableProperties[CALLS], 2);
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
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget);
                const expectedStyle = wuwTarget.style;
                const actualStyle = wuwTarget.style;
                assert.strictEqual(actualStyle, expectedStyle);
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
            },
        );
    },
);

describe
(
    'spy targeting',
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
            'does not spy an inheritor',
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
    },
);
