/* eslint-env browser, mocha */
/* global assert, wuw */

'use strict';

const CHANGE_PROPERTY_STACK_TRACE_PATTERN =
/^(?: *at )?changeProperty\b.*wuw\.spec\.js(\?[\da-f]*)?:\d+:\d+\b/;

function changeProperty(obj, propertyKey, value = 'lorem ipsum')
{
    obj[propertyKey] = value;
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
                    'sets a property',
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
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { target: wuwTarget, propertyKey: 'textContent', success: true });
                        assert.notProperty(access, 'error');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.equal(wuwTarget.textContent, 'lorem ipsum');
                    },
                );

                it
                (
                    'fails to set a read-only data property',
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
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { target: wuwTarget, propertyKey: 'TEXT_NODE', success: false });
                        assert.notProperty(access, 'error');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.notEqual(wuwTarget.TEXT_NODE, 'lorem ipsum');
                    },
                );

                it
                (
                    'fails to set a read-only accessor property',
                    () =>
                    {
                        const expectedError = SyntaxError('foo');
                        const wuwTarget = // eslint-disable-next-line accessor-pairs
                        {
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
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { target: wuwTarget, propertyKey: 'foo', error: expectedError });
                        assert.notProperty(access, 'success');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
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
                    'sets a property',
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
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { target: spyTarget, propertyKey: 'display', success: true });
                        assert.notProperty(access, 'error');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.equal(wuwTarget.style.display, 'none');
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
