// wuw – https://github.com/fasttime/wuw

'use strict';

{
    // Shared //////////////////////////////////////////////////////////////////////////////////////

    const _CSSStyleDeclaration_prototype_item   = CSSStyleDeclaration.prototype.item;
    const _Error                                = Error;
    const _Error_captureStackTrace              = _Error.captureStackTrace;
    const _JSON_stringify                       = JSON.stringify;
    const _Math_floor                           = Math.floor;
    const _Math_max                             = Math.max;
    const _Node_prototype_hasChildNodes         = Node.prototype.hasChildNodes;
    const _Object_create                        = Object.create;
    const _Object_defineProperties              = Object.defineProperties;
    const _Object_defineProperty                = Object.defineProperty;
    const _Object_freeze                        = Object.freeze;
    const _Object_getOwnPropertyDescriptors     = Object.getOwnPropertyDescriptors;
    const _Object_getOwnPropertyNames           = Object.getOwnPropertyNames;
    const _Object_getOwnPropertySymbols         = Object.getOwnPropertySymbols;
    const _Proxy                                = Proxy;
    const _Proxy_revocable                      = _Proxy.revocable;
    const _RangeError                           = RangeError;
    const _Reflect_defineProperty               = Reflect.defineProperty;
    const _Reflect_deleteProperty               = Reflect.deleteProperty;
    const _Reflect_get                          = Reflect.get;
    const _Reflect_getPrototypeOf               = Reflect.getPrototypeOf;
    const _Reflect_setPrototypeOf               = Reflect.setPrototypeOf;
    const _Reflect_set                          = Reflect.set;
    const _Set                                  = Set;
    const _String                               = String;
    const _Symbol                               = Symbol;
    const _TypeError                            = TypeError;
    const _console_error                        = console.error;
    const _console_log                          = console.log;
    const _console_warn                         = console.warn;
    const _performance =
    typeof module === 'object' ? require('perf_hooks').performance : performance;

    // Definition helpers //////////////////////////////////////////////////////////////////////////

    let fullNamePartsMap = new Map();

    let callerFullName;

    function defineConstant(obj, propertyKey, value)
    {
        _Object_defineProperty(obj, propertyKey, { configurable: true, value });
    }

    function defineFunction(obj, name, fn)
    {
        const caller =
        _Object_defineProperties
        (
            (...args) =>
            {
                try
                {
                    callerFullName = fullName;
                    const returnValue = fn(...args);
                    return returnValue;
                }
                finally
                {
                    callerFullName = undefined;
                }
            },
            {
                length: { configurable: true, value: fn.length },
                name: { configurable: true, value: name },
            }
        );
        const fullName = defineInterface(obj, name, caller).join('.');
        return caller;
    }

    function defineInterface(obj, name, uniqueValue)
    {
        const fullNameParts = (fullNamePartsMap.get(obj) || []).concat(name);
        fullNamePartsMap.set(uniqueValue, fullNameParts);
        defineConstant(obj, name, uniqueValue);
        return fullNameParts;
    }

    function defineVariable(obj, propertyKey, get, set)
    {
        _Object_defineProperty(obj, propertyKey, { configurable: true, get, set });
    }

    // Initialization //////////////////////////////////////////////////////////////////////////////

    const resetActions = [];
    const initActions = [];

    function runActions(actions)
    {
        actions.forEach(action => action());
    }

    // Notifications ///////////////////////////////////////////////////////////////////////////////

    const { installCallback, notify, uninstallAllCallbacks, uninstallCallback } =
    (() =>
    {
        const callbackSet = new _Set();

        function installCallback(callback)
        {
            callbackSet.add(callback);
        }

        function notify(record)
        {
            for (const callback of callbackSet)
            {
                try
                {
                    callback(record);
                }
                catch (error)
                {
                    _console_error(error);
                }
            }
        }

        function uninstallAllCallbacks()
        {
            callbackSet.clear();
        }

        function uninstallCallback(callback)
        {
            callbackSet.delete(callback);
        }

        resetActions.push(uninstallAllCallbacks);

        const returnValue = { installCallback, notify, uninstallAllCallbacks, uninstallCallback };
        return returnValue;
    }
    )();

    // Watching core ///////////////////////////////////////////////////////////////////////////////

    let remarkUndeletableProperties;

    const watching = { };

    const wuw =
    (() =>
    {
        const wuw = defineFunction(typeof self === 'undefined' ? global : self, 'wuw', watch);

        const spyHandler = { get: spyGet, set: spySet };
        const wuwHandler = { get: wuwGet, set: wuwSet };

        const spyInfoMap = new WeakMap();
        const wuwInfoMap = new WeakMap();

        let wuwGeneration;

        function adaptValue(wuwTarget, propertyKey, value)
        {
            if (propertyKey === 'style' && isCSSStyleDeclaration(value))
            {
                let spyInfo = spyInfoMap.get(value);
                if (spyInfo)
                    value = spyInfo.spy;
                else
                {
                    const spy = new _Proxy(value, spyHandler);
                    spyInfo = { spy, wuwTarget };
                    spyInfoMap.set(value, spyInfo);
                    value = spy;
                }
            }
            return value;
        }

        const captureStackTrace =
        (() =>
        {
            const internalCaptureStackTrace =
            _Error_captureStackTrace ?
            constructorOpt =>
            {
                const obj = { };
                _Error_captureStackTrace(obj, constructorOpt);
                const stackTrace = obj.stack.replace(/^.{5}\n/, '');
                return stackTrace;
            } :
            () =>
            {
                const stackTrace = _Error().stack.replace(/^(Error\n)?(?:.*\n){4}/, '');
                return stackTrace;
            };

            const captureStackTrace =
            'stackTraceLimit' in _Error ?
            constructorOpt =>
            {
                const { stackTraceLimit } = _Error;
                _Error.stackTraceLimit = Infinity;
                const stackTrace = internalCaptureStackTrace(constructorOpt);
                _Error.stackTraceLimit = stackTraceLimit;
                return stackTrace;
            } :
            constructorOpt => internalCaptureStackTrace(constructorOpt);

            return captureStackTrace;
        }
        )();

        function confirmWuwTarget({ wuwTarget })
        {
            const wuwInfo = wuwInfoMap.get(wuwTarget);
            if (wuwInfo)
            {
                if (wuwInfo.wuwGeneration === wuwGeneration)
                    return true;
                doUnwatch(wuwTarget, wuwInfo);
            }
            return false;
        }

        function detachMirror(wuwTarget, mirror)
        {
            const watchProxy = _Reflect_getPrototypeOf(wuwTarget);
            _Reflect_setPrototypeOf(wuwTarget, _Reflect_getPrototypeOf(mirror));
            return watchProxy;
        }

        function doMirrorGet(mirror, propertyKey, wuwTarget)
        {
            const watchProxy = detachMirror(wuwTarget, mirror);
            let value;
            try
            {
                value = _Reflect_get(mirror, propertyKey, wuwTarget);
            }
            finally
            {
                _Reflect_setPrototypeOf(wuwTarget, watchProxy);
            }
            const adaptedValue = adaptValue(wuwTarget, propertyKey, value);
            return adaptedValue;
        }

        function doMirrorSet({ remarkedPropertyKeys }, mirror, propertyKey, value, wuwTarget)
        {
            const record =
            {
                target: wuwTarget,
                propertyKey,
                stackTrace: captureStackTrace(wuwSet),
                startTime: now(),
            };
            const watchProxy = detachMirror(wuwTarget, mirror);
            let success;
            let error;
            try
            {
                success = _Reflect_set(mirror, propertyKey, value, wuwTarget);
                record.success = success;
            }
            catch (errorCaught)
            {
                error = errorCaught;
                record.error = error;
            }
            const ownDescs = stripOwnProperties(wuwTarget, remarkedPropertyKeys);
            _Object_defineProperties(mirror, ownDescs);
            _Reflect_setPrototypeOf(wuwTarget, watchProxy);
            record.endTime = now();
            _Object_freeze(record);
            notify(record);
            if (error !== undefined)
                throw error;
            return success;
        }

        function doSpyTargetSet(spyTarget, propertyKey, value)
        {
            const record =
            {
                target: spyTarget,
                propertyKey,
                stackTrace: captureStackTrace(spySet),
                startTime: now(),
            };
            let success;
            let error;
            try
            {
                success = _Reflect_set(spyTarget, propertyKey, value);
                record.success = success;
            }
            catch (errorCaught)
            {
                error = errorCaught;
                record.error = error;
            }
            record.endTime = now();
            _Object_freeze(record);
            notify(record);
            if (error !== undefined)
                throw error;
            return success;
        }

        function doUnwatch(wuwTarget, { mirror, revoke })
        {
            revoke();
            const ownDescs = _Object_getOwnPropertyDescriptors(mirror);
            unstripOwnProperties(wuwTarget, ownDescs);
            _Reflect_setPrototypeOf(wuwTarget, _Reflect_getPrototypeOf(mirror));
            wuwInfoMap.delete(wuwTarget);
        }

        function getOwnPropertyKeys(obj)
        {
            const propertyKeys =
            [..._Object_getOwnPropertyNames(obj), ..._Object_getOwnPropertySymbols(obj)];
            return propertyKeys;
        }

        function isCSSStyleDeclaration(obj)
        {
            try
            {
                _CSSStyleDeclaration_prototype_item.call(obj, -1);
            }
            catch (error)
            {
                return false;
            }
            return true;
        }

        function isNode(obj)
        {
            try
            {
                _Node_prototype_hasChildNodes.call(obj);
            }
            catch (error)
            {
                return false;
            }
            return true;
        }

        function newWuwGeneration()
        {
            wuwGeneration = _Symbol();
        }

        function now()
        {
            const time = _performance.now();
            return time;
        }

        function spyGet(target, propertyKey, receiver)
        {
            const spyInfo = spyInfoMap.get(target);
            if (spyInfo && spyInfo.spy === receiver)
            {
                confirmWuwTarget(spyInfo);
                receiver = target;
            }
            const value = _Reflect_get(target, propertyKey, receiver);
            return value;
        }

        function spySet(target, propertyKey, value, receiver)
        {
            let success;
            const spyInfo = spyInfoMap.get(target);
            if (spyInfo && spyInfo.spy === receiver)
            {
                const operation = confirmWuwTarget(spyInfo) ? doSpyTargetSet : _Reflect_set;
                success = operation(target, propertyKey, value);
            }
            else
                success = _Reflect_set(target, propertyKey, value, receiver);
            return success;
        }

        function stripOwnProperties(wuwTarget, remarkedPropertyKeys)
        {
            const ownDescs = _Object_getOwnPropertyDescriptors(wuwTarget);
            const propertyKeys = getOwnPropertyKeys(ownDescs);
            const undeletablePropertyKeys =
            propertyKeys.filter
            (
                propertyKey =>
                {
                    // Some exotic objects may have configurable properties that cannot be deleted.
                    // In Firefox, instances of CSS2Properties retrieved by the style property of
                    // HTML elements are examples of such objects.
                    if
                    (
                        ownDescs[propertyKey].configurable &&
                        _Reflect_deleteProperty(wuwTarget, propertyKey)
                    )
                        return false;
                    delete ownDescs[propertyKey];
                    if (remarkedPropertyKeys.has(propertyKey))
                        return false;
                    remarkedPropertyKeys.add(propertyKey);
                    return true;
                }
            );
            if (undeletablePropertyKeys.length && remarkUndeletableProperties)
                remarkUndeletableProperties(wuwTarget, undeletablePropertyKeys);
            return ownDescs;
        }

        function unstripOwnProperties(wuwTarget, ownDescs)
        {
            const propertyKeys = getOwnPropertyKeys(ownDescs);
            for (const propertyKey of propertyKeys)
                _Reflect_defineProperty(wuwTarget, propertyKey, ownDescs[propertyKey]);
        }

        function unwatch(wuwTarget)
        {
            if (wuwTarget === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (!isNode(wuwTarget))
                throw _TypeError(`Argument of ${callerFullName} does not implement interface Node`);
            const wuwInfo = wuwInfoMap.get(wuwTarget);
            if (wuwInfo)
                doUnwatch(wuwTarget, wuwInfo);
            return wuw;
        }

        function unwatchAll()
        {
            newWuwGeneration();
            return wuw;
        }

        function watch(wuwTarget)
        {
            if (wuwTarget === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (!isNode(wuwTarget))
                throw _TypeError(`Argument of ${callerFullName} does not implement interface Node`);
            const wuwInfo = wuwInfoMap.get(wuwTarget);
            if (!wuwInfo || wuwInfo.wuwGeneration !== wuwGeneration)
            {
                if (wuwInfo)
                    doUnwatch(wuwTarget, wuwInfo);
                const remarkedPropertyKeys = new _Set();
                const ownDescs = stripOwnProperties(wuwTarget, remarkedPropertyKeys);
                const mirror = _Object_create(_Reflect_getPrototypeOf(wuwTarget), ownDescs);
                const { proxy: watchProxy, revoke } = _Proxy_revocable(mirror, wuwHandler);
                _Reflect_setPrototypeOf(wuwTarget, watchProxy);
                wuwInfoMap.set(wuwTarget, { mirror, remarkedPropertyKeys, revoke, wuwGeneration });
            }
            return wuw;
        }

        function wuwGet(target, propertyKey, receiver)
        {
            const wuwInfo = wuwInfoMap.get(receiver);
            if (wuwInfo && target === wuwInfo.mirror)
            {
                if (wuwInfo.wuwGeneration === wuwGeneration)
                {
                    const value = doMirrorGet(target, propertyKey, receiver);
                    return value;
                }
                doUnwatch(receiver, wuwInfo);
            }
            const value = _Reflect_get(target, propertyKey, receiver);
            return value;
        }

        function wuwSet(target, propertyKey, value, receiver)
        {
            const wuwInfo = wuwInfoMap.get(receiver);
            if (wuwInfo && target === wuwInfo.mirror)
            {
                if (wuwInfo.wuwGeneration === wuwGeneration)
                {
                    const success = doMirrorSet(wuwInfo, target, propertyKey, value, receiver);
                    return success;
                }
                doUnwatch(receiver, wuwInfo);
            }
            const success = _Reflect_set(target, propertyKey, value, receiver);
            return success;
        }

        initActions.push(newWuwGeneration);

        defineInterface(wuw, 'watching', watching);

        defineFunction(wuw, 'watch', watch);
        defineFunction(wuw, 'unwatch', unwatch);
        defineFunction(wuw, 'unwatchAll', unwatchAll);
        defineFunction(watching, 'watch', watch);
        defineFunction(watching, 'unwatch', unwatch);
        defineFunction(watching, 'unwatchAll', unwatchAll);

        return wuw;
    }
    )();

    // Remarking ///////////////////////////////////////////////////////////////////////////////////

    {
        const defaultRemarkUndeletableProperties =
        (wuwTarget, undeletablePropertyKeys) =>
        {
            const formattedPropertyKeys =
            formatList(undeletablePropertyKeys.map(formatPropertyKey));
            _console_warn
            (
                'The target object %o has undeletable properties: %s',
                wuwTarget,
                formattedPropertyKeys
            );
        };

        function formatList(list)
        {
            // const formattedList = (new Intl.ListFormat('en')).format(list);
            let formattedList = '';
            let counter = 0;
            for (let index = list.length; --index >= 0;)
            {
                switch (counter++)
                {
                case 0:
                    break;
                case 1:
                    formattedList = ` and ${formattedList}`;
                    break;
                default:
                    formattedList = `, ${formattedList}`;
                    break;
                }
                formattedList = list[index] + formattedList;
            }
            return formattedList;
        }

        function formatPropertyKey(propertyKey)
        {
            const str = (typeof propertyKey === 'string' ? _JSON_stringify : _String)(propertyKey);
            return str;
        }

        function getRemarkUndeletableProperties()
        {
            return remarkUndeletableProperties;
        }

        function setRemarkUndeletableProperties(value)
        {
            if (value !== undefined && value !== null && typeof value !== 'function')
            {
                const error =
                _TypeError('remarkUndeletableProperties must be a function, undefined or null');
                throw error;
            }
            remarkUndeletableProperties = value || null;
        }

        remarkUndeletableProperties = defaultRemarkUndeletableProperties;

        defineConstant
        (wuw, 'defaultRemarkUndeletableProperties', defaultRemarkUndeletableProperties);
        defineVariable
        (
            wuw,
            'remarkUndeletableProperties',
            getRemarkUndeletableProperties,
            setRemarkUndeletableProperties
        );
        defineConstant
        (watching, 'defaultRemarkUndeletableProperties', defaultRemarkUndeletableProperties);
        defineVariable
        (
            watching,
            'remarkUndeletableProperties',
            getRemarkUndeletableProperties,
            setRemarkUndeletableProperties
        );
    }

    // Doing ///////////////////////////////////////////////////////////////////////////////////////

    const doing = { };

    {
        function do_(callback)
        {
            if (callback === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (typeof callback !== 'function')
                throw _TypeError(`Argument of ${callerFullName} is not a function`);
            installCallback(callback);
            return wuw;
        }

        function doNothing()
        {
            uninstallAllCallbacks();
            return wuw;
        }

        function dont(callback)
        {
            if (callback === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (typeof callback !== 'function')
                throw _TypeError(`Argument of ${callerFullName} is not a function`);
            uninstallCallback(callback);
            return wuw;
        }

        defineInterface(wuw, 'doing', doing);

        defineFunction(wuw, 'do', do_);
        defineFunction(wuw, 'dont', dont);
        defineFunction(wuw, 'doNothing', doNothing);
        defineFunction(doing, 'do', do_);
        defineFunction(doing, 'dont', dont);
        defineFunction(doing, 'doNothing', doNothing);
    }

    // Logging /////////////////////////////////////////////////////////////////////////////////////

    {
        let logIndex = 0;
        const maxRecords = 10000;
        const recordQueue = [];

        const clear =
        () =>
        {
            logIndex = 0;
            recordQueue.splice(0, Infinity);
        };

        function getMaxRecords()
        {
            return maxRecords;
        }

        function * log()
        {
            while (logIndex < recordQueue.length)
            {
                const record = recordQueue[logIndex++];
                yield record;
            }
        }

        function logRecord(record)
        {
            if (recordQueue.length >= maxRecords)
            {
                if (logIndex)
                    --logIndex;
                recordQueue.shift();
            }
            recordQueue.push(record);
        }

        function setMaxRecords(value)
        {
            value = +value;
            if (value < 0 || value !== _Math_floor(value))
                throw _RangeError('Invalid number of records');
            maxRecords = value + 0;
            const excess = recordQueue.length - maxRecords;
            if (excess > 0)
            {
                logIndex = _Math_max(logIndex - excess, 0);
                recordQueue.splice(0, excess);
            }
        }

        const snapshot =
        () =>
        {
            const snapshot = recordQueue.slice();
            return snapshot;
        };

        resetActions.push(clear);
        initActions.push(() => installCallback(logRecord));

        defineFunction(wuw, 'clear', clear);
        defineConstant(wuw, 'defaultMaxRecords', maxRecords);
        defineFunction(wuw, 'log', log);
        defineVariable(wuw, 'maxRecords', getMaxRecords, setMaxRecords);
        defineFunction(wuw, 'snapshot', snapshot);
    }

    // Live Reporting //////////////////////////////////////////////////////////////////////////////

    {
        let liveRecords = null;

        const callPrintLiveRecordsLater =
        typeof setImmediate !== 'undefined' ?
        () => void setImmediate(printLiveRecords) :
        (() =>
        {
            const { port1, port2 } = new MessageChannel();
            port1.onmessage = printLiveRecords;
            const callPrintLiveRecordsLater = () => port2.postMessage();
            return callPrintLiveRecordsLater;
        }
        )();

        const liveOff =
        () =>
        {
            uninstallCallback(printLiveRecordLater);
            return wuw;
        };

        const liveOn =
        () =>
        {
            installCallback(printLiveRecordLater);
            return wuw;
        };

        function printLiveRecordLater(record)
        {
            if (liveRecords)
                liveRecords.push(record);
            else
            {
                liveRecords = [record];
                callPrintLiveRecordsLater();
            }
        }

        function printLiveRecords()
        {
            for (;;)
            {
                const record = liveRecords.shift();
                if (!record)
                    break;
                _console_log('wuw record\n%o', record);
            }
            liveRecords = null;
        }

        {
            const live = () => liveOn();
            defineFunction(live, 'on', liveOn);
            defineFunction(live, 'off', liveOff);
            defineFunction(wuw, 'live', live);
        }
    }

    // Finalization ////////////////////////////////////////////////////////////////////////////////

    {
        function reset()
        {
            runActions(resetActions);
            runActions(initActions);
            return wuw;
        }

        defineFunction(wuw, 'reset', reset);
    }

    fullNamePartsMap = null;
    runActions(initActions);
}
