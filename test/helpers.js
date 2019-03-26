/* eslint-env browser, mocha */
/* global assert, chai */

'use strict';

// multilineRegExp /////////////////////////////////////////////////////////////////////////////////

function multilineRegExp(...regExps)
{
    const regExp = RegExp(regExps.map(({ source }) => source).join(''));
    return regExp;
}

// changeProperty //////////////////////////////////////////////////////////////////////////////////

const CHANGE_PROPERTY_STACK_TRACE_PATTERN =
/^(?:(?: *at )?changeProperty\b.*\bhelpers\.js(\?[\da-f]*)?:\d+:\d+\b.*\n){11}/;

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
    /(?:(?: *at )?reflectChangeProperty\b.*\bhelpers\.js(?:\?[\da-f]*)?:\d+:\d+\b.*\n){11}/,
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

// Assertions //////////////////////////////////////////////////////////////////////////////////////

{
    const { Assertion } = chai;

    {
        const isInteger =
        assert.isInteger =
        (valueToCheck, message) =>
        {
            new Assertion(valueToCheck, message, isInteger, true)
            .assert(Number.isInteger(valueToCheck), 'expected #{act} to be an integer');
        };
    }
    {
        const DELTA = 10;

        const timeRange =
        assert.timeRange =
        (actStartTime, actEndTime, expStartTime, expEndTime) =>
        {
            new Assertion(actStartTime, undefined, timeRange, true).closeTo(expStartTime, DELTA);
            new Assertion(actEndTime, undefined, timeRange, true).closeTo(expEndTime, DELTA);
            new Assertion(actEndTime, undefined, timeRange, true).least(actStartTime);
        };
    }
    {
        function formatPropertyKey(propertyKey)
        {
            const str =
            typeof propertyKey === 'string' ? JSON.stringify(propertyKey) : String(propertyKey);
            return str;
        }

        const hasConsistentOwnProperties =
        assert.hasConsistentOwnProperties =
        obj =>
        {
            const ownDescs = Object.getOwnPropertyDescriptors(obj);
            for (const [propertyKey, ownDesc] of Object.entries(ownDescs))
            {
                void
                new Assertion
                (
                    ownDesc.enumerable,
                    `Property ${formatPropertyKey(propertyKey)} should be not enumerable`,
                    hasConsistentOwnProperties,
                    true,
                )
                .false;
                void
                new Assertion
                (
                    ownDesc.configurable,
                    `Property ${formatPropertyKey(propertyKey)} should be configurable`,
                    hasConsistentOwnProperties,
                    true,
                )
                .true;
                if ('value' in ownDesc)
                {
                    void
                    new Assertion
                    (
                        ownDesc.writable,
                        `Property ${formatPropertyKey(propertyKey)} should be not writable`,
                        hasConsistentOwnProperties,
                        true,
                    )
                    .false;
                }
            }
        };
    }
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

// Sandbox /////////////////////////////////////////////////////////////////////////////////////////

const WUW_PATH = window.__karma__ ? '/base/lib/wuw.' : '../lib/wuw.';
const WUW_SELECTORS = [`script[src^="${WUW_PATH}"]`, '#wuw-js'];

function loadWuw(mocks = { })
{
    const promise =
    new Promise
    (
        resolve =>
        {
            const oldScript = document.querySelector(WUW_SELECTORS);
            oldScript.remove();
            const script = document.createElement('script');
            script.src = oldScript.src;
            script.id = 'wuw-js';
            script.onload =
            () =>
            {
                const { wuw } = selfMock;
                Object.defineProperty(window, 'self', selfDesc);
                for (const [objKey, ownDescs] of Object.entries(backups))
                {
                    for (const [propKey, ownDesc] of Object.entries(ownDescs))
                        Object.defineProperty(self[objKey], propKey, ownDesc);
                }
                resolve(wuw);
            };
            document.head.appendChild(script);
            const backups = { };
            for (const [objKey, mock] of Object.entries(mocks))
            {
                const backup = backups[objKey] = { };
                const obj = self[objKey];
                for (const [propKey, propValue] of Object.entries(mock))
                {
                    backup[propKey] =
                    Object.getOwnPropertyDescriptor(obj, propKey);
                    const ownDesc = { configurable: true, value: propValue };
                    Object.defineProperty(obj, propKey, ownDesc);
                }
            }
            const selfMock = { };
            const selfDesc = Object.getOwnPropertyDescriptor(window, 'self');
            Object.defineProperty
            (window, 'self', { configurable: true, value: selfMock });
        },
    );
    return promise;
}

// itAll ///////////////////////////////////////////////////////////////////////////////////////////

function itAll(dataSets, title, fn)
{
    if (typeof title !== 'function')
    {
        const titleStr = String(title);
        title = (dataSet, index) => `${titleStr} #${index}`;
    }
    dataSets.forEach
    (
        (dataSet, index) =>
        {
            const dataSetObj = Object(dataSet);
            const itCall = dataSetObj.skip ? it.skip : dataSetObj.only ? it.only : it;
            itCall(title(dataSet, index), fn.bind(null, dataSet));
        },
    );
}
