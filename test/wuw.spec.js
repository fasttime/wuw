/* eslint-env browser, mocha */
/* global assert, chai, wuw */

'use strict';

function multilineRegExp(...regExps)
{
    const regExp = RegExp(regExps.map(({ source }) => source).join(''));
    return regExp;
}

// changeProperty //////////////////////////////////////////////////////////////////////////////////

const CHANGE_PROPERTY_STACK_TRACE_PATTERN =
/^(?:(?: *at )?changeProperty\b.*wuw\.spec\.js(\?[\da-f]*)?:\d+:\d+\b.*\n){11}/;

function changeProperty(obj, propertyKey, value = 'lorem ipsum', depth = 11)
{
    if (--depth)
        changeProperty(obj, propertyKey, value, depth);
    else
        obj[propertyKey] = value;
}

const REFLECT_CHANGE_PROPERTY_STACK_TRACE_PATTERN =
multilineRegExp
(
    /^(?:.*\bset\b.*\n)?/,
    /(?:(?: *at )?reflectChangeProperty\b.*wuw\.spec\.js(?:\?[\da-f]*)?:\d+:\d+\b.*\n){11}/,
);

function reflectChangeProperty(obj, propertyKey, value = 'lorem ipsum', depth = 11)
{
    let success;
    if (--depth)
        success = reflectChangeProperty(obj, propertyKey, value, depth);
    else
        success = Reflect.set(obj, propertyKey, value);
    return success;
}

// mock ////////////////////////////////////////////////////////////////////////////////////////////

const CALLS = Symbol('calls');

function mock()
{
    const stub =
    function (...args)
    {
        const call = { args, this: this };
        calls.push(call);
    };
    const calls = stub[CALLS] = [];
    return stub;
}

// Assertions //////////////////////////////////////////////////////////////////////////////////////

{
    const { Assertion } = chai;

    const DELTA = 10;

    const timeRange =
    (actStartTime, actEndTime, expStartTime, expEndTime) =>
    {
        new Assertion(actStartTime, undefined, timeRange, true).to.be.closeTo(expStartTime, DELTA);
        new Assertion(actEndTime, undefined, timeRange, true).to.be.closeTo(expEndTime, DELTA);
        new Assertion(actEndTime, undefined, timeRange, true).to.be.least(actStartTime);
    };
    assert.timeRange = timeRange;
}

// Unit Tests //////////////////////////////////////////////////////////////////////////////////////

describe
(
    'wuw',
    () =>
    {
        it
        (
            'is defined correctly',
            () =>
            {
                assert.ownInclude(wuw, { length: 1, name: 'wuw' });
                assert.notProperty(wuw, 'prototype');
            },
        );

        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw(document.createTextNode(''));
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.strictEqual
                (
                    Object.getPrototypeOf(Object.getPrototypeOf(wuwTarget)),
                    HTMLDataElement.prototype,
                );
            },
        );

        it
        (
            'throws for missing argument',
            () =>
            {
                assert.throws(() => wuw(), TypeError, 'Argument of wuw is missing or undefined');
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
                    () => wuw(wuwTarget),
                    TypeError,
                    'Argument of wuw does not implement interface Node',
                );
            },
        );
    },
);

describe
(
    'wuw set trap',
    () =>
    {
        beforeEach(() => wuw.clear());

        it
        (
            'records a successful property set',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
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
                wuw(wuwTarget);
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
                wuw(wuwTarget);
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
            'does not wuw an inheritor',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
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
                const remarkUndeletableProperties = wuw.remarkUndeletableProperties = mock();
                wuw(wuwTarget);
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
    'spy',
    () =>
    {
        it
        (
            'targets only once',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
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
                wuw(wuwTarget);
                const actualStyle = wuwTarget.style;
                assert.strictEqual(actualStyle, expectedStyle);
            },
        );
    },
);

describe
(
    'spy set trap',
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
                wuw(wuwTarget);
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
                wuw(wuwTarget);
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
                wuw(wuwTarget);
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
                wuw(wuwTarget);
                const inheritor = Object.create(wuwTarget.style);
                void inheritor.foo;
                inheritor.foo = 'bar';
                const snapshot = wuw.snapshot();
                assert.isEmpty(snapshot);
            },
        );
    },
);
