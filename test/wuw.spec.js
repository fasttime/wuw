/* eslint-env browser, mocha */
/* global assert, chai, wuw */

'use strict';

const CHANGE_PROPERTY_STACK_TRACE_PATTERN =
/^(?: *at )?changeProperty\b.*wuw\.spec\.js(\?[\da-f]*)?:\d+:\d+\b/;

function changeProperty(obj, propertyKey, value = 'lorem ipsum')
{
    obj[propertyKey] = value;
}

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

describe
(
    'wuw',
    () =>
    {
        describe
        (
            'wuw',
            () =>
            {
                it
                (
                    'records a successful property set',
                    () =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        wuw.clear();
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
                        wuw.clear();
                        wuw(wuwTarget);
                        const expectedStartTime = performance.now();
                        assert.throws(() => changeProperty(wuwTarget, 'TEXT_NODE'), TypeError);
                        const expectedEndTime = performance.now();
                        const snapshot = wuw.snapshot();
                        assert.lengthOf(snapshot, 1);
                        const [record] = snapshot;
                        assert.ownInclude
                        (record, { target: wuwTarget, propertyKey: 'TEXT_NODE', success: false });
                        assert.notProperty(record, 'error');
                        assert.timeRange
                        (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                        assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.notEqual(wuwTarget.TEXT_NODE, 'lorem ipsum');
                    },
                );

                it
                (
                    'records a failed read-only accessor property set',
                    () =>
                    {
                        const expectedError = SyntaxError('foo');
                        const wuwTarget =
                        { // eslint-disable-line accessor-pairs
                            set foo(value)
                            {
                                throw expectedError;
                            },
                        };
                        wuw.clear();
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
                    'wuws only once',
                    () =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        wuw(wuwTarget);
                        wuw(wuwTarget);
                        changeProperty(wuwTarget, 'textContent');
                        assert.strictEqual
                        (
                            Object.getPrototypeOf(Object.getPrototypeOf(wuwTarget)),
                            HTMLDataElement.prototype,
                        );
                    },
                );

                it
                (
                    'does not wuw an inheritor',
                    () =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwTarget);
                        changeProperty(Object.create(wuwTarget), 'foo');
                        const snapshot = wuw.snapshot();
                        assert.isEmpty(snapshot);
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
                    'records a successful property set',
                    () =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        const spyTarget = wuwTarget.style;
                        wuw.clear();
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
                        wuw.clear();
                        wuw(wuwTarget);
                        const expectedStartTime = performance.now();
                        assert.throws(() => changeProperty(wuwTarget.style, 'foo'), TypeError);
                        const expectedEndTime = performance.now();
                        const snapshot = wuw.snapshot();
                        assert.lengthOf(snapshot, 1);
                        const [record] = snapshot;
                        assert.ownInclude
                        (record, { target: spyTarget, propertyKey: 'foo', success: false });
                        assert.notProperty(record, 'error');
                        assert.timeRange
                        (record.startTime, record.endTime, expectedStartTime, expectedEndTime);
                        assert.match(record.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
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
                        wuw.clear();
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
                    'spies only once',
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
                    'does not spy an inheritor',
                    () =>
                    {
                        const wuwTarget = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwTarget);
                        changeProperty(Object.create(wuwTarget.style), 'foo');
                        const snapshot = wuw.snapshot();
                        assert.isEmpty(snapshot);
                    },
                );
            },
        );
    },
);
