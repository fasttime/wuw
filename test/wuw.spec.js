/* eslint-env browser, mocha */
/* global assert, wuw */

'use strict';

const CHANGE_PROPERTY_STACK_TRACE_PATTERN =
/^(?: *at )?changeProperty\b.*wuw\.spec\.js(\?[\da-f]*)?:\d+:\d+\b/;

function changeProperty(wuwable, propertyKey)
{
    wuwable[propertyKey] = 'lorem ipsum';
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
                        const wuwable = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwable);
                        const expectedStartTime = performance.now();
                        changeProperty(wuwable, 'textContent');
                        const expectedEndTime = performance.now();
                        const snapshot = wuw.snapshot();
                        assert.lengthOf(snapshot, 1);
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { wuwable, propertyKey: 'textContent', success: true });
                        assert.notProperty(access, 'error');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.equal(wuwable.textContent, 'lorem ipsum');
                    },
                );

                it
                (
                    'fails to set a read-only property',
                    () =>
                    {
                        const wuwable = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwable);
                        const expectedStartTime = performance.now();
                        assert.throws(() => changeProperty(wuwable, 'TEXT_NODE'), TypeError);
                        const expectedEndTime = performance.now();
                        const snapshot = wuw.snapshot();
                        assert.lengthOf(snapshot, 1);
                        const [access] = snapshot;
                        assert.ownInclude
                        (access, { wuwable, propertyKey: 'TEXT_NODE', success: false });
                        assert.notProperty(access, 'error');
                        assert.closeTo(access.startTime, expectedStartTime, 8);
                        assert.closeTo(access.endTime, expectedEndTime, 8);
                        assert.isAtLeast(access.endTime, access.startTime);
                        assert.match(access.stackTrace, CHANGE_PROPERTY_STACK_TRACE_PATTERN);
                        assert.notEqual(wuwable.TEXT_NODE, 'lorem ipsum');
                    },
                );

                it
                (
                    'fails to set a read-only property',
                    () =>
                    {
                        const expectedError = SyntaxError('foo');
                        const wuwable = // eslint-disable-next-line accessor-pairs
                        {
                            set foo(value)
                            {
                                throw expectedError;
                            },
                        };
                        wuw.clear();
                        wuw(wuwable);
                        const expectedStartTime = performance.now();
                        let actualError;
                        try
                        {
                            changeProperty(wuwable, 'foo');
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
                        (access, { error: expectedError, wuwable, propertyKey: 'foo' });
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
                        const wuwable = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwable);
                        wuw(wuwable);
                        changeProperty(wuwable, 'textContent');
                        assert.strictEqual
                        (
                            Object.getPrototypeOf(Object.getPrototypeOf(wuwable)),
                            HTMLDataElement.prototype,
                        );
                    },
                );

                it
                (
                    'does not wuw an inheritor',
                    () =>
                    {
                        const wuwable = document.createElement('DATA');
                        wuw.clear();
                        wuw(wuwable);
                        changeProperty(Object.create(wuwable), 'foo');
                        const snapshot = wuw.snapshot();
                        assert.isEmpty(snapshot);
                    },
                );
            },
        );
    },
);
