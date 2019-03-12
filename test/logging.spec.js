/* eslint-env browser, mocha */
/* global assert, wuw */

'use strict';

// getOperationInfoIterator ////////////////////////////////////////////////////////////////////////

function getOperationInfoIterator()
{
    const operationIterator =
    [
        {
            wuwTarget: document.createDocumentFragment(),
            operation:
            wuwTarget =>
            {
                wuwTarget.textContent = '';
            },
        },
        {
            wuwTarget: document.createElementNS('http://www.w3.org/2000/svg', 'svg'),
            operation:
            wuwTarget =>
            {
                wuwTarget.currentScale = 2;
            },
        },
        {
            wuwTarget: document.createElement('DATA'),
            operation:
            wuwTarget =>
            {
                wuwTarget.style.display = 'none';
            },
        },
    ]
    .values();
    return operationIterator;
}

// Unit tests //////////////////////////////////////////////////////////////////////////////////////

describe
(
    'logging',
    () => it('has expected properties', () => assert.hasConsistentOwnProperties(wuw.logging)),
);

describe
(
    'log',
    () =>
    {
        it('has expected properties', () => assert.hasConsistentOwnProperties(wuw.log));

        it
        (
            'iterates over the logged records',
            () =>
            {
                const operationIterator = getOperationInfoIterator();
                for (let expectedLength = 0; ; ++expectedLength)
                {
                    const { value, done } = operationIterator.next();
                    assert.lengthOf(wuw.log, expectedLength);
                    assert.lengthOf([...wuw.log], expectedLength);
                    if (done)
                        break;
                    const { wuwTarget, operation } = value;
                    wuw(wuwTarget);
                    operation(wuwTarget);
                }
            },
        );

        it
        (
            'length is read-only',
            () =>
            {
                assert.throws
                (
                    () =>
                    {
                        wuw.log.length = 0;
                    },
                    TypeError,
                );
            },
        );

        describe
        (
            '[Symbol.iterator]',
            () =>
            {
                it
                (
                    'has expected properties',
                    () =>
                    {
                        assert.ownInclude(wuw.log[Symbol.iterator], { length: 0, name: 'values' });
                        assert.notProperty(wuw.log[Symbol.iterator], 'prototype');
                    },
                );

                it
                (
                    'returns a generator',
                    () =>
                    {
                        const IterablePrototype =
                        Object.getPrototypeOf
                        (
                            Object.getPrototypeOf
                            (
                                function * ()
                                { }
                                .prototype,
                            ),
                        );
                        const iterator = wuw.log[Symbol.iterator]();
                        assert(IterablePrototype.isPrototypeOf(iterator));
                    },
                );
            },
        );
    },
);

describe
(
    'snapshot',
    () =>
    {
        it
        (
            'returns an array',
            () =>
            {
                const returnValue = wuw.snapshot();
                assert.isArray(returnValue);
            },
        );

        it
        (
            'returns an array with the logged records',
            () =>
            {
                const operationIterator = getOperationInfoIterator();
                for (let expectedLength = 0; ; ++expectedLength)
                {
                    const { value, done } = operationIterator.next();
                    const snapshot = wuw.snapshot();
                    assert.lengthOf(snapshot, expectedLength);
                    if (done)
                        break;
                    const { wuwTarget, operation } = value;
                    wuw(wuwTarget);
                    operation(wuwTarget);
                }
            },
        );

        describe
        (
            'has expected properties',
            () =>
            {
                const data =
                [
                    { snapshot: wuw.snapshot,           callerFullName: 'wuw.snapshot' },
                    { snapshot: wuw.logging.snapshot,   callerFullName: 'wuw.logging.snapshot' },
                ];
                for (const { snapshot, callerFullName } of data)
                {
                    it
                    (
                        callerFullName,
                        () =>
                        {
                            assert.ownInclude(snapshot, { length: 0, name: 'snapshot' });
                            assert.notProperty(snapshot, 'prototype');
                        },
                    );
                }
            },
        );
    },
);

describe
(
    'clearLog',
    () =>
    {
        it
        (
            'returns wuw',
            () =>
            {
                const returnValue = wuw.clearLog();
                assert.strictEqual(returnValue, wuw);
            },
        );

        it
        (
            'resets the log',
            () =>
            {
                const wuwTarget = document.createElement('DIV');
                wuw(wuwTarget);
                wuwTarget.innerHTML = '<BR>';
                wuw.clearLog();
                assert.lengthOf(wuw.log, 0);
                assert.deepEqual([...wuw.log], []);
            },
        );

        it
        (
            'resets the snapshot',
            () =>
            {
                const wuwTarget = document.createElement('DIV');
                wuw(wuwTarget);
                wuwTarget.innerHTML = '<BR>';
                wuw.clearLog();
                assert.lengthOf(wuw.snapshot(), 0);
            },
        );

        describe
        (
            'has expected properties',
            () =>
            {
                const data =
                [
                    { clearLog: wuw.clearLog,           callerFullName: 'wuw.clearLog' },
                    { clearLog: wuw.logging.clearLog,   callerFullName: 'wuw.logging.clearLog' },
                ];
                for (const { clearLog, callerFullName } of data)
                {
                    it
                    (
                        callerFullName,
                        () =>
                        {
                            assert.ownInclude(clearLog, { length: 0, name: 'clearLog' });
                            assert.notProperty(clearLog, 'prototype');
                        },
                    );
                }
            },
        );
    },
);

describe
(
    'defaultMaxLogLength',
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
                        wuw.defaultMaxLogLength = 1;
                    },
                    TypeError,
                );
            },
        );

        it
        (
            'is a non-negative integer',
            () =>
            {
                assert.isAtLeast(wuw.defaultMaxLogLength, 0);
                assert.isInteger(wuw.defaultMaxLogLength);
            },
        );
    },
);

describe
(
    'maxLogLength',
    () =>
    {
        it
        (
            'is initially set to defaultMaxLogLength',
            () =>
            {
                assert.strictEqual(wuw.maxLogLength, wuw.defaultMaxLogLength);
            },
        );

        it
        (
            'decreases the log length',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw(wuwTarget);
                for (let index = 0; index < 4; ++index)
                    wuwTarget[index] = 'foo';
                wuw.maxLogLength = 2;
                assert.lengthOf(wuw.log, 2);
                assert.lengthOf([...wuw.log], 2);
                const snapshot = wuw.snapshot();
                assert.propertyVal(snapshot[0], 'propertyKey', '2');
                assert.propertyVal(snapshot[1], 'propertyKey', '3');
            },
        );

        describe
        (
            'can be set to',
            () =>
            {
                const testData =
                [
                    { value: 0,                 expected: 0 },
                    { value: -0,                expected: 0 },
                    { value: ' 42 ',            expected: 42 },
                    { value: Number.MAX_VALUE,  expected: Number.MAX_VALUE },
                    { value: Infinity,          expected: Infinity },
                    { value: false,             expected: 0 },
                    { value: true,              expected: 1 },
                    { value: null,              expected: 0 },
                ];
                for (const { value, expected } of testData)
                {
                    it
                    (
                        String(value),
                        () =>
                        {
                            wuw.maxLogLength = value;
                            assert.strictEqual(wuw.maxLogLength, expected);
                        },
                    );
                }
            },
        );

        describe
        (
            'cannot be set to',
            () =>
            {
                const testData = [-1, 2.5, NaN, '42f', { }, undefined];
                for (const value of testData)
                {
                    it
                    (
                        String(value),
                        () =>
                        {
                            assert.throws
                            (
                                () =>
                                {
                                    wuw.maxLogLength = value;
                                },
                                RangeError,
                                'Invalid log length',
                            );
                        },
                    );
                }
            },
        );
    },
);

describe
(
    'record logging',
    () =>
    {
        it
        (
            'drops the oldest record after maxLogLength records',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).maxLogLength = 1;
                wuwTarget.foo = 1;
                wuwTarget.bar = 2;
                assert.lengthOf(wuw.log, 1);
                assert.propertyVal(wuw.snapshot()[0], 'propertyKey', 'bar');
            },
        );

        it
        (
            'does not log a record when maxLogLength is 0',
            () =>
            {
                const wuwTarget = document.createElement('DATA');
                wuw.watch(wuwTarget).maxLogLength = 0;
                wuwTarget.foo = 'bar';
                assert.lengthOf(wuw.log, 0);
            },
        );
    },
);
