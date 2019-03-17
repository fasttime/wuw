// wuw – https://github.com/fasttime/wuw

'use strict';

{
    // Shared //////////////////////////////////////////////////////////////////////////////////////

    const _CSSStyleDeclaration_prototype_item   = CSSStyleDeclaration.prototype.item;
    const _Error                                = Error;
    const _Error_captureStackTrace              = _Error.captureStackTrace;
    const _Intl_ListFormat                      = Intl.ListFormat;
    const _JSON_stringify                       = JSON.stringify;
    const _Math_floor                           = Math.floor;
    const _Node_prototype_hasChildNodes         = Node.prototype.hasChildNodes;
    const _Object                               = Object;
    const
    {
        create:                     _Object_create,
        defineProperties:           _Object_defineProperties,
        defineProperty:             _Object_defineProperty,
        freeze:                     _Object_freeze,
        getOwnPropertyDescriptors:  _Object_getOwnPropertyDescriptors,
        getOwnPropertyNames:        _Object_getOwnPropertyNames,
        getOwnPropertySymbols:      _Object_getOwnPropertySymbols,
    } =
    _Object;
    const _Proxy                                = Proxy;
    const _Proxy_revocable                      = _Proxy.revocable;
    const _RangeError                           = RangeError;
    const
    {
        defineProperty: _Reflect_defineProperty,
        deleteProperty: _Reflect_deleteProperty,
        get:            _Reflect_get,
        getPrototypeOf: _Reflect_getPrototypeOf,
        setPrototypeOf: _Reflect_setPrototypeOf,
        set:            _Reflect_set,
    } =
    Reflect;
    const _Set                                  = Set;
    const _String                               = String;
    const _Symbol                               = Symbol;
    const _TypeError                            = TypeError;
    const _console                              = console;
    const
    {
        error:          _console_error,
        groupCollapsed: _console_groupCollapsed,
        groupEnd:       _console_groupEnd,
        log:            _console_log,
        warn:           _console_warn,
    } =
    _console;
    const _performance =
    typeof module === 'object' ? require('perf_hooks').performance : performance;

    const formatPropertyKey =
    propertyKey =>
    typeof propertyKey === 'string' ?
    _JSON_stringify(propertyKey) : _JSON_stringify(_String(propertyKey)).slice(1, -1);

    // Definition helpers //////////////////////////////////////////////////////////////////////////

    const defineConstant =
    (obj, propertyKey, value) =>
    _Object_defineProperty(obj, propertyKey, { configurable: true, value });

    const defineFunction =
    (obj, name, fn) =>
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
    };

    const defineInterface =
    (obj, name, uniqueValue) =>
    {
        const fullNameParts = (fullNamePartsMap.get(obj) || []).concat(name);
        fullNamePartsMap.set(uniqueValue, fullNameParts);
        defineConstant(obj, name, uniqueValue);
        return fullNameParts;
    };

    const defineVariable =
    (obj, propertyKey, get, set) =>
    _Object_defineProperty(obj, propertyKey, { configurable: true, get, set });

    let fullNamePartsMap = new Map();

    let callerFullName;

    // Initialization //////////////////////////////////////////////////////////////////////////////

    const runActions = actions => actions.forEach(action => action());

    const resetActions = [];
    const initActions = [];

    // Notifications ///////////////////////////////////////////////////////////////////////////////

    const
    { installCallback, isCallbackInstalled, notify, uninstallAllCallbacks, uninstallCallback } =
    (() =>
    {
        const installCallback = callback => callbackSet.add(callback);

        const isCallbackInstalled = callback => callbackSet.has(callback);

        const notify =
        record =>
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
        };

        const uninstallAllCallbacks = () => callbackSet.clear();

        const uninstallCallback = callback => callbackSet.delete(callback);

        const callbackSet = new _Set();

        resetActions.push(uninstallAllCallbacks);

        const returnValue =
        { installCallback, isCallbackInstalled, notify, uninstallAllCallbacks, uninstallCallback };
        return returnValue;
    }
    )();

    // Watching core ///////////////////////////////////////////////////////////////////////////////

    const watching = { };

    const wuw =
    (() =>
    {
        const adaptValue =
        (wuwTarget, propertyKey, value) =>
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
        };

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
            constructorOpt => filterStack(constructorOpt, _Error());

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
            internalCaptureStackTrace;

            return captureStackTrace;
        }
        )();

        const confirmWuwTarget =
        ({ wuwTarget }) =>
        {
            const wuwInfo = wuwInfoMap.get(wuwTarget);
            if (wuwInfo)
            {
                if (wuwInfo.wuwGeneration === wuwGeneration)
                    return true;
                doUnwatch(wuwTarget, wuwInfo);
            }
            return false;
        };

        const detachMirror =
        (wuwTarget, mirror) =>
        {
            const watchProxy = _Reflect_getPrototypeOf(wuwTarget);
            _Reflect_setPrototypeOf(wuwTarget, _Reflect_getPrototypeOf(mirror));
            return watchProxy;
        };

        const doMirrorGet =
        (mirror, propertyKey, wuwTarget) =>
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
        };

        const doMirrorSet =
        (wuwInfo, mirror, propertyKey, value, wuwTarget) =>
        {
            const record =
            {
                __proto__: recordPrototype,
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
            const ownDescs = stripOwnProperties(wuwTarget, wuwInfo.remarkedPropertyKeys);
            _Object_defineProperties(mirror, ownDescs);
            _Reflect_setPrototypeOf(wuwTarget, watchProxy);
            record.endTime = now();
            _Object_freeze(record);
            notify(record);
            if (error !== undefined)
                throw error;
            return success;
        };

        const doSpyTargetSet =
        (spyTarget, propertyKey, value) =>
        {
            const record =
            {
                __proto__: recordPrototype,
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
        };

        const doUnwatch =
        (wuwTarget, { mirror, revoke }) =>
        {
            revoke();
            const ownDescs = _Object_getOwnPropertyDescriptors(mirror);
            unstripOwnProperties(wuwTarget, ownDescs);
            _Reflect_setPrototypeOf(wuwTarget, _Reflect_getPrototypeOf(mirror));
            wuwInfoMap.delete(wuwTarget);
        };

        const getOwnPropertyKeys =
        obj => [..._Object_getOwnPropertyNames(obj), ..._Object_getOwnPropertySymbols(obj)];

        const isCSSStyleDeclaration =
        obj =>
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
        };

        const isNode =
        obj =>
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
        };

        const newWuwGeneration =
        () =>
        {
            wuwGeneration = _Symbol();
        };

        const now = () => _performance.now();

        const recordPrototype =
        {
            splitStackTrace()
            {
                const stackTraceArray =
                this.stackTrace.replace(/\n$/, '').split(stackTraceSplitter);
                return stackTraceArray;
            },
        };

        const spyGet =
        (target, propertyKey, receiver) =>
        {
            const spyInfo = spyInfoMap.get(target);
            if (spyInfo && spyInfo.spy === receiver)
            {
                confirmWuwTarget(spyInfo);
                receiver = target;
            }
            const value = _Reflect_get(target, propertyKey, receiver);
            return value;
        };

        const spySet =
        (target, propertyKey, value, receiver) =>
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
        };

        const stripOwnProperties =
        (wuwTarget, remarkedPropertyKeys) =>
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
        };

        const unstripOwnProperties =
        (wuwTarget, ownDescs) =>
        {
            const propertyKeys = getOwnPropertyKeys(ownDescs);
            for (const propertyKey of propertyKeys)
                _Reflect_defineProperty(wuwTarget, propertyKey, ownDescs[propertyKey]);
        };

        const unwatch =
        wuwTarget =>
        {
            if (wuwTarget === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (!isNode(wuwTarget))
                throw _TypeError(`Argument of ${callerFullName} does not implement interface Node`);
            const wuwInfo = wuwInfoMap.get(wuwTarget);
            if (wuwInfo)
                doUnwatch(wuwTarget, wuwInfo);
            return wuw;
        };

        const unwatchAll =
        () =>
        {
            newWuwGeneration();
            return wuw;
        };

        const watch =
        wuwTarget =>
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
        };

        const wuwGet =
        (target, propertyKey, receiver) =>
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
        };

        const wuwSet =
        (target, propertyKey, value, receiver) =>
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
        };

        const wuw = defineFunction(typeof self === 'undefined' ? global : self, 'wuw', watch);

        const spyHandler = { get: spyGet, set: spySet };
        const wuwHandler = { get: wuwGet, set: wuwSet };

        const spyInfoMap = new WeakMap();
        const wuwInfoMap = new WeakMap();

        let wuwGeneration;

        let filterStack;
        let stackTraceSplitter;

        initActions.push(newWuwGeneration);

        {
            let atPrefixUsed;
            if (_Error_captureStackTrace)
                atPrefixUsed = true;
            else
            {
                filterStack =
                (constructorOpt, obj) =>
                {
                    const { 1: group, index } = obj.stack.match(/^(    ?at )?0\b/m);
                    constructorOpt.stackTraceOffset = index;
                    atPrefixUsed = group;
                };
                (
                    {
                        0()
                        {
                            const proxyTarget = { };

                            const wuwTarget = new _Proxy(proxyTarget, wuwHandler);
                            wuwInfoMap.set(wuwTarget, { mirror: proxyTarget });
                            wuwTarget._ = null;

                            const spy = new _Proxy(proxyTarget, spyHandler);
                            spyInfoMap.set(proxyTarget, { spy, wuwTarget });
                            spy._ = null;
                        },
                    }
                )
                [0]();
                filterStack =
                (constructorOpt, obj) => obj.stack.slice(constructorOpt.stackTraceOffset);
            }
            stackTraceSplitter = atPrefixUsed ? /(?:^|\n)(?=    ?at )/g : '\n';
        }

        defineConstant(wuw, 'toString', () => 'wuw');
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

    let remarkUndeletableProperties;

    // Remarking ///////////////////////////////////////////////////////////////////////////////////

    {
        const defaultRemarkUndeletableProperties =
        _Object_defineProperty
        (
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
            },
            'name',
            { configurable: true, value: 'remarkUndeletableProperties' }
        );

        const formatList =
        _Intl_ListFormat ?
        (() =>
        {
            const listFormat = new _Intl_ListFormat('en');
            const formatList = list => listFormat.format(list);
            return formatList;
        }
        )() :
        list =>
        {
            const { length } = list;
            const formattedList =
            length > 2 ?
            `${list.slice(0, -1).join(', ')}, and ${list[length - 1]}` : list.join(' and ');
            return formattedList;
        };

        const getRemarkUndeletableProperties = () => remarkUndeletableProperties;

        const setRemarkUndeletableProperties =
        value =>
        {
            if (value !== undefined && value !== null && typeof value !== 'function')
            {
                const error =
                _TypeError('remarkUndeletableProperties must be a function, undefined or null');
                throw error;
            }
            remarkUndeletableProperties = value || null;
        };

        initActions.push
        (
            () =>
            {
                remarkUndeletableProperties = defaultRemarkUndeletableProperties;
            }
        );

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
        const do_ =
        callback =>
        {
            validateCallback(callback);
            installCallback(callback);
            return wuw;
        };

        const doNothing =
        () =>
        {
            uninstallAllCallbacks();
            return wuw;
        };

        const dont =
        callback =>
        {
            validateCallback(callback);
            uninstallCallback(callback);
            return wuw;
        };

        const isDoing =
        callback =>
        {
            validateCallback(callback);
            const returnValue = isCallbackInstalled(callback);
            return returnValue;
        };

        const validateCallback =
        callback =>
        {
            if (callback === undefined)
                throw _TypeError(`Argument of ${callerFullName} is missing or undefined`);
            if (typeof callback !== 'function')
                throw _TypeError(`Argument of ${callerFullName} is not a function`);
        };

        defineInterface(wuw, 'doing', doing);

        defineFunction(wuw, 'do', do_);
        defineFunction(wuw, 'dont', dont);
        defineFunction(wuw, 'doNothing', doNothing);
        defineFunction(wuw, 'isDoing', isDoing);
        defineFunction(doing, 'do', do_);
        defineFunction(doing, 'dont', dont);
        defineFunction(doing, 'doNothing', doNothing);
        defineFunction(doing, 'isDoing', isDoing);
    }

    // Logging /////////////////////////////////////////////////////////////////////////////////////

    const logging = { };

    {
        const clearLog =
        () =>
        {
            doClearLog();
            return wuw;
        };

        const defaultMaxLogLength = 10000;

        const doClearLog =
        () =>
        {
            firstSlot = lastSlot = { next: null };
            logLength = 0;
        };

        const getLogLength = () => logLength;

        const getLoggingEnabled = () => isCallbackInstalled(logRecord);

        const getMaxLogLength = () => maxLogLength;

        const iterator =
        function * ()
        {
            for (let slot = firstSlot, link; link = slot.next; { slot } = link)
                yield link.record;
        };

        const log = { };

        const logRecord =
        record =>
        {
            const slot = { next: null };
            lastSlot.next = { record, slot };
            lastSlot = slot;
            if (logLength < maxLogLength)
                ++logLength;
            else
                firstSlot = firstSlot.next.slot;
        };

        const setLoggingEnabled = value => (value ? installCallback : uninstallCallback)(logRecord);

        const setMaxLogLength =
        value =>
        {
            value = +value;
            if (value < 0 || value !== _Math_floor(value))
                throw _RangeError('Invalid log length');
            maxLogLength = value + 0;
            while (logLength > maxLogLength)
            {
                firstSlot = firstSlot.next.slot;
                --logLength;
            }
        };

        const snapshot =
        () =>
        {
            const snapshot = [];
            for (let slot = firstSlot, link; link = slot.next; { slot } = link)
                snapshot.push(link.record);
            return snapshot;
        };

        const values =
        _Object_defineProperty(() => iterator(), 'name', { configurable: true, value: 'values' });

        let firstSlot;
        let lastSlot;

        let logLength;

        let maxLogLength;

        initActions.push
        (
            () =>
            {
                doClearLog();
                maxLogLength = defaultMaxLogLength;
                installCallback(logRecord);
            }
        );

        defineInterface(wuw, 'logging', logging);

        defineConstant(wuw, 'log', log);
        defineFunction(wuw, 'snapshot', snapshot);
        defineFunction(wuw, 'clearLog', clearLog);
        defineVariable(wuw, 'loggingEnabled', getLoggingEnabled, setLoggingEnabled);
        defineConstant(wuw, 'defaultMaxLogLength', defaultMaxLogLength);
        defineVariable(wuw, 'maxLogLength', getMaxLogLength, setMaxLogLength);

        defineConstant(logging, 'log', log);
        defineFunction(logging, 'snapshot', snapshot);
        defineFunction(logging, 'clearLog', clearLog);
        defineVariable(logging, 'loggingEnabled', getLoggingEnabled, setLoggingEnabled);
        defineConstant(logging, 'defaultMaxLogLength', defaultMaxLogLength);
        defineVariable(logging, 'maxLogLength', getMaxLogLength, setMaxLogLength);

        defineVariable(log, 'length', getLogLength);
        defineConstant(log, _Symbol.iterator, values);
    }

    // Live Reporting //////////////////////////////////////////////////////////////////////////////

    const liveReporting = { };

    {
        const RECORD_TITLE_CSS =
        'background: dodgerblue; border-radius: .2em; color: white; padding: 0 1em;';

        const printLiveRecords =
        () =>
        {
            for (;;)
            {
                const record = liveRecords.shift();
                if (!record)
                    break;
                printRecord(record);
            }
            liveRecords = null;
        };

        const callPrintLiveRecordsLater =
        typeof setImmediate !== 'undefined' ?
        () => setImmediate(printLiveRecords) :
        (() =>
        {
            const { port1, port2 } = new MessageChannel();
            port1.onmessage = printLiveRecords;
            const callPrintLiveRecordsLater =
            () => port2.postMessage(null);
            return callPrintLiveRecordsLater;
        }
        )();

        const isLiveReportingEnabled = () => isCallbackInstalled(printLiveRecordLater);

        const live =
        () =>
        {
            installCallback(printLiveRecordLater);
            return wuw;
        };

        const printLiveRecordLater =
        record =>
        {
            if (liveRecords)
                liveRecords.push(record);
            else
            {
                callPrintLiveRecordsLater();
                liveRecords = [record];
            }
        };

        const printRecord =
        _console.markTimeline ?
        (() =>
        {
            const printRecord =
            record =>
            {
                _console_log('%cwuw record', RECORD_TITLE_CSS);
                printRecordField('target', record.target);
                printRecordField('property key', formatPropertyKey(record.propertyKey));
                printRecordField('stack trace', record.splitStackTrace());
                printRecordField('start time', record.startTime);
                printRecordField('end time', record.endTime);
                const { error } = record;
                if (error === undefined)
                    printRecordField('success', record.success);
                else
                    printRecordField('error', error);
            };

            const printRecordField =
            (label, value) =>
            {
                const paddedLabel = label.padEnd(13, '\xa0');
                if (_Object(value) !== value)
                {
                    _console_groupCollapsed(`${paddedLabel} ${value}`);
                    _console_groupEnd();
                }
                else
                    _console_log(paddedLabel, value, '…');
            };

            return printRecord;
        }
        )() :
        record =>
        {
            const FIELD_CSS = 'color: slategrey; font-family: Menlo, monospace;';

            const { error } = record;
            let resultLabel;
            let result;
            if (error === undefined)
            {
                resultLabel = 'success       ';
                result = record.success;
            }
            else
            {
                resultLabel = 'error         ';
                result = error;
            }
            _console_log
            (
                '%cwuw record%c\n'  +
                '%c%s%o\n'          +
                '%c%s%c%s\n'        +
                '%c%s%o\n'          +
                '%c%s%o\n'          +
                '%c%s%o\n'          +
                '%c%s%c%o',
                RECORD_TITLE_CSS,               '',
                FIELD_CSS, 'target        ',    record.target,
                FIELD_CSS, 'property key  ',    '', formatPropertyKey(record.propertyKey),
                FIELD_CSS, 'stack trace   ',    record.splitStackTrace(),
                FIELD_CSS, 'start time    ',    record.startTime,
                FIELD_CSS, 'end time      ',    record.endTime,
                FIELD_CSS, resultLabel,         '', result
            );
        };

        const setLiveReportingEnabled =
        value => (value ? installCallback : uninstallCallback)(printLiveRecordLater);

        const unlive =
        () =>
        {
            uninstallCallback(printLiveRecordLater);
            return wuw;
        };

        let liveRecords = null;

        defineInterface(wuw, 'liveReporting', liveReporting);

        defineFunction(wuw, 'live', live);
        defineFunction(wuw, 'unlive', unlive);
        defineVariable
        (wuw, 'liveReportingEnabled', isLiveReportingEnabled, setLiveReportingEnabled);

        defineFunction(liveReporting, 'live', live);
        defineFunction(liveReporting, 'unlive', unlive);
        defineVariable
        (liveReporting, 'liveReportingEnabled', isLiveReportingEnabled, setLiveReportingEnabled);
    }

    // Finalization ////////////////////////////////////////////////////////////////////////////////

    {
        const reset =
        () =>
        {
            runActions(resetActions);
            runActions(initActions);
            return wuw;
        };

        defineFunction(wuw, 'reset', reset);
    }

    fullNamePartsMap = null;
    runActions(initActions);
}
