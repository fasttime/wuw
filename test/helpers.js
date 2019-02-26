/* eslint-env browser */
/* global assert, chai */

'use strict';

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

const WUW_PATH = window.__karma__ ? '/base/lib/wuw.js' : '../lib/wuw.js';

function loadWuw(_console_error)
{
    const promise =
    new Promise
    (
        resolve =>
        {
            {
                const script = document.querySelector(`script[src="${WUW_PATH}"]`);
                if (script)
                    script.parentNode.removeChild(script);
            }
            {
                const script = document.createElement('script');
                script.onload =
                () =>
                {
                    const { wuw } = selfMock;
                    Object.defineProperty(window, 'self', selfDesc);
                    Object.defineProperty(console, 'error', _console_errorDesc);
                    resolve(wuw);
                };
                script.src = WUW_PATH;
                document.head.appendChild(script);
                const selfMock = { };
                const selfDesc = Object.getOwnPropertyDescriptor(window, 'self');
                Object.defineProperty
                (window, 'self', { configurable: true, value: selfMock });
                const _console_errorDesc = Object.getOwnPropertyDescriptor(console, 'error');
                Object.defineProperty
                (console, 'error', { configurable: true, value: _console_error });
            }
        },
    );
    return promise;
}
