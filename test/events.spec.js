/* eslint-env browser, mocha */
/* global CALLS, CHANGE_PROPERTY_STACK_TRACE_PATTERN, assert, changeProperty, loadWuw, mock, wuw */

'use strict';

describe
(
    'wuw.on',
    () =>
    {
        it
        (
            'is defined correctly',
            () =>
            {
                const ownDesc = Object.getOwnPropertyDescriptor(wuw, 'on');
                assert.include(ownDesc, { configurable: true, enumerable: false, writable: false });
            },
        );

        it
        (
            'has expected properties',
            () =>
            {
                assert.ownInclude(wuw.on, { length: 1, name: 'on' });
                assert.notProperty(wuw.on, 'prototype');
            },
        );

        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.on(Function());
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'targets only once',
            () =>
            {
                const callback = mock();
                wuw.on(callback);
                wuw.on(callback);
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.lengthOf(callback[CALLS], 1);
            },
        );

        it
        (
            'throws for missing argument',
            () =>
            {
                assert.throws
                (() => wuw.on(), TypeError, 'Argument of wuw.on is missing or undefined');
            },
        );

        it
        (
            'throws for invalid argument',
            () =>
            {
                assert.throws
                (
                    () => wuw.on(Object.create(Function())),
                    TypeError,
                    'Argument of wuw.on is not a function',
                );
            },
        );

        it
        (
            'works as expected',
            async () =>
            {
                const expectedError = SyntaxError('bar');
                const _console_error = mock();
                const wuw = await loadWuw(_console_error);
                wuw.on
                (
                    () =>
                    {
                        throw expectedError;
                    },
                );
                const callback = mock();
                wuw.on(callback);
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
    },
);

describe
(
    'wuw.off',
    () =>
    {
        it
        (
            'is defined correctly',
            () =>
            {
                const ownDesc = Object.getOwnPropertyDescriptor(wuw, 'off');
                assert.include(ownDesc, { configurable: true, enumerable: false, writable: false });
            },
        );

        it
        (
            'has expected properties',
            () =>
            {
                assert.ownInclude(wuw.off, { length: 1, name: 'off' });
                assert.notProperty(wuw.off, 'prototype');
            },
        );

        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.off(Function());
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'throws for missing argument',
            () =>
            {
                assert.throws
                (() => wuw.off(), TypeError, 'Argument of wuw.off is missing or undefined');
            },
        );

        it
        (
            'throws for invalid argument',
            () =>
            {
                assert.throws
                (
                    () => wuw.off(Object.create(Function())),
                    TypeError,
                    'Argument of wuw.off is not a function',
                );
            },
        );

        it
        (
            'works as expected',
            () =>
            {
                const callback = mock();
                wuw.on(callback);
                wuw.off(callback);
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                wuwTarget.textContent = 'foobar';
                assert.isEmpty(callback[CALLS]);
            },
        );
    },
);
