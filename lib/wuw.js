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
    const _Object_keys                          = Object.keys;
    const _Proxy                                = Proxy;
    const _RangeError                           = RangeError;
    const _Reflect_deleteProperty               = Reflect.deleteProperty;
    const _Reflect_get                          = Reflect.get;
    const _Reflect_getPrototypeOf               = Reflect.getPrototypeOf;
    const _Reflect_setPrototypeOf               = Reflect.setPrototypeOf;
    const _Reflect_set                          = Reflect.set;
    const _Set                                  = Set;
    const _String                               = String;
    const _TypeError                            = TypeError;
    const _console_error                        = console.error;
    const _console_log                          = console.log;
    const _console_warn                         = console.warn;
    const _performance =
    typeof module === 'object' ? require('perf_hooks').performance : performance;

    function defineConstant(obj, propertyKey, value)
    {
        _Object_defineProperty(obj, propertyKey, { configurable: true, value });
    }

    function defineVariable(obj, propertyKey, get, set)
    {
        _Object_defineProperty(obj, propertyKey, { configurable: true, get, set });
    }

    // Notifications ///////////////////////////////////////////////////////////////////////////////

    const { follow, notify, unfollow } =
    (() =>
    {
        const callbackSet = new _Set();

        function follow(callback)
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

        function unfollow(callback)
        {
            callbackSet.delete(callback);
        }

        const returnValue = { follow, notify, unfollow };
        return returnValue;
    }
    )();

    // Core ////////////////////////////////////////////////////////////////////////////////////////

    let remarkUndeletableProperties;

    const wuw =
    (() =>
    {
        const spyHandler = { get: spyGet, set: spySet };
        const wuwHandler = { get: wuwGet, set: wuwSet };

        const spyInfoMap = new WeakMap();
        const wuwInfoMap = new WeakMap();

        function adaptValue(propertyKey, value)
        {
            if (propertyKey === 'style' && isCSSStyleDeclaration(value))
            {
                let spyInfo = spyInfoMap.get(value);
                if (spyInfo)
                    value = spyInfo.spy;
                else
                {
                    const spy = new Proxy(value, spyHandler);
                    spyInfo = { spy };
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

        function detachMirror(wuwTarget, mirror)
        {
            const prototypeProxy = _Reflect_getPrototypeOf(wuwTarget);
            _Reflect_setPrototypeOf(wuwTarget, _Reflect_getPrototypeOf(mirror));
            return prototypeProxy;
        }

        function doMirrorGet(mirror, propertyKey, wuwTarget)
        {
            const prototypeProxy = detachMirror(wuwTarget, mirror);
            let value;
            try
            {
                value = _Reflect_get(mirror, propertyKey, wuwTarget);
            }
            finally
            {
                _Reflect_setPrototypeOf(wuwTarget, prototypeProxy);
            }
            const adaptedValue = adaptValue(propertyKey, value);
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
            const prototypeProxy = detachMirror(wuwTarget, mirror);
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
            _Reflect_setPrototypeOf(wuwTarget, prototypeProxy);
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

        function now()
        {
            const time = _performance.now();
            return time;
        }

        function spyGet(target, propertyKey, receiver)
        {
            const spyInfo = spyInfoMap.get(target);
            const value =
            _Reflect_get
            (target, propertyKey, spyInfo && spyInfo.spy === receiver ? target : receiver);
            return value;
        }

        function spySet(target, propertyKey, value, receiver)
        {
            const spyInfo = spyInfoMap.get(target);
            const operation = spyInfo && spyInfo.spy === receiver ? doSpyTargetSet : _Reflect_set;
            const success = operation(target, propertyKey, value, receiver);
            return success;
        }

        function stripOwnProperties(wuwTarget, remarkedPropertyKeys)
        {
            const ownDescs = _Object_getOwnPropertyDescriptors(wuwTarget);
            const propertyKeys = _Object_keys(ownDescs);
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

        function wuwGet(target, propertyKey, receiver)
        {
            const wuwInfo = wuwInfoMap.get(receiver);
            const operation = wuwInfo && target === wuwInfo.mirror ? doMirrorGet : _Reflect_get;
            const value = operation(target, propertyKey, receiver);
            return value;
        }

        function wuwSet(target, propertyKey, value, receiver)
        {
            const wuwInfo = wuwInfoMap.get(receiver);
            const success =
            wuwInfo && target === wuwInfo.mirror ?
            doMirrorSet(wuwInfo, target, propertyKey, value, receiver) :
            _Reflect_set(target, propertyKey, value, receiver);
            return success;
        }

        const wuw =
        wuwTarget =>
        {
            if (wuwTarget === undefined)
                throw _TypeError('Argument of wuw is missing or undefined');
            if (!isNode(wuwTarget))
                throw _TypeError('Argument of wuw does not implement interface Node');
            if (wuwInfoMap.has(wuwTarget))
                return;
            const remarkedPropertyKeys = new _Set();
            const ownDescs = stripOwnProperties(wuwTarget, remarkedPropertyKeys);
            const mirror = _Object_create(_Reflect_getPrototypeOf(wuwTarget), ownDescs);
            const proxy = new _Proxy(mirror, wuwHandler);
            _Reflect_setPrototypeOf(wuwTarget, proxy);
            wuwInfoMap.set(wuwTarget, { mirror, remarkedPropertyKeys });
            return wuw;
        };

        return wuw;
    }
    )();

    (typeof self === 'undefined' ? global : self).wuw = wuw;

    // Remarking ///////////////////////////////////////////////////////////////////////////////////

    {
        remarkUndeletableProperties =
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

        defineConstant(wuw, 'defaultRemarkUndeletableProperties', remarkUndeletableProperties);
        defineVariable
        (
            wuw,
            'remarkUndeletableProperties',
            getRemarkUndeletableProperties,
            setRemarkUndeletableProperties
        );
    }

    // Events //////////////////////////////////////////////////////////////////////////////////////

    {
        const off =
        callback =>
        {
            if (callback === undefined)
                throw _TypeError('Argument of wuw.off is missing or undefined');
            if (typeof callback !== 'function')
                throw _TypeError('Argument of wuw.off is not a function');
            unfollow(callback);
            return wuw;
        };

        const on =
        callback =>
        {
            if (callback === undefined)
                throw _TypeError('Argument of wuw.on is missing or undefined');
            if (typeof callback !== 'function')
                throw _TypeError('Argument of wuw.on is not a function');
            follow(callback);
            return wuw;
        };

        defineConstant(wuw, 'on', on);
        defineConstant(wuw, 'off', off);
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

        follow(logRecord);

        defineConstant(wuw, 'clear', clear);
        defineConstant(wuw, 'defaultMaxRecords', maxRecords);
        defineConstant(wuw, 'log', log);
        defineVariable(wuw, 'maxRecords', getMaxRecords, setMaxRecords);
        defineConstant(wuw, 'snapshot', snapshot);
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
            unfollow(printLiveRecordLater);
            return wuw;
        };

        const liveOn =
        () =>
        {
            follow(printLiveRecordLater);
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
            defineConstant(live, 'on', liveOn);
            defineConstant(live, 'off', liveOff);
            defineConstant(wuw, 'live', live);
        }
    }
}
