'use strict';

{
    const _Error                            = Error;
    const _Error_captureStackTrace          = _Error.captureStackTrace;
    const _JSON_stringify                   = JSON.stringify;
    const _Object_create                    = Object.create;
    const _Object_defineProperties          = Object.defineProperties;
    const _Object_freeze                    = Object.freeze;
    const _Object_getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors;
    const _Object_keys                      = Object.keys;
    const _Proxy                            = Proxy;
    const _Reflect_deleteProperty           = Reflect.deleteProperty;
    const _Reflect_get                      = Reflect.get;
    const _Reflect_getPrototypeOf           = Reflect.getPrototypeOf;
    const _Reflect_setPrototypeOf           = Reflect.setPrototypeOf;
    const _Reflect_set                      = Reflect.set;
    const _performance =
    typeof module === 'object' ? require('perf_hooks').performance : performance;

    function adaptValue(value)
    {
        if (
            typeof CSS2Properties !== 'undefined' && value instanceof CSS2Properties ||
            typeof CSSStyleDeclaration !== 'undefined' && value instanceof CSSStyleDeclaration)
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
        const adaptedValue = adaptValue(value);
        return adaptedValue;
    }

    function doMirrorSet(mirror, propertyKey, value, wuwTarget)
    {
        const access =
        {
            target: wuwTarget,
            propertyKey,
            stackTrace: stackTrace(wuwSet),
            startTime: now(),
        };
        const prototypeProxy = detachMirror(wuwTarget, mirror);
        let success;
        let error;
        try
        {
            success = _Reflect_set(mirror, propertyKey, value, wuwTarget);
            access.success = success;
        }
        catch (errorCaught)
        {
            error = errorCaught;
            access.error = error;
        }
        const ownDescs = stripOwnProperties(wuwTarget);
        _Object_defineProperties(mirror, ownDescs);
        _Reflect_setPrototypeOf(wuwTarget, prototypeProxy);
        access.endTime = now();
        _Object_freeze(access);
        log.push(access);
        if (error !== undefined)
            throw error;
        return success;
    }

    function doSpyTargetGet(spyTarget, propertyKey)
    {
        const value = _Reflect_get(spyTarget, propertyKey);
        const adaptedValue = adaptValue(value);
        return adaptedValue;
    }

    function doSpyTargetSet(spyTarget, propertyKey, value)
    {
        const access =
        {
            target: spyTarget,
            propertyKey,
            stackTrace: stackTrace(spySet),
            startTime: now(),
        };
        let success;
        let error;
        try
        {
            success = _Reflect_set(spyTarget, propertyKey, value);
            access.success = success;
        }
        catch (errorCaught)
        {
            error = errorCaught;
            access.error = error;
        }
        access.endTime = now();
        _Object_freeze(access);
        log.push(access);
        if (error !== undefined)
            throw error;
        return success;
    }

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

    function now()
    {
        const time = _performance.now();
        return time;
    }

    function spyGet(target, propertyKey, receiver)
    {
        const spyInfo = spyInfoMap.get(target);
        const operation = spyInfo && spyInfo.spy === receiver ? doSpyTargetGet : _Reflect_get;
        const value = operation(target, propertyKey, receiver);
        return value;
    }

    function spySet(target, propertyKey, value, receiver)
    {
        const spyInfo = spyInfoMap.get(target);
        const operation = spyInfo && spyInfo.spy === receiver ? doSpyTargetSet : _Reflect_set;
        const success = operation(target, propertyKey, value, receiver);
        return success;
    }

    const stackTrace =
    _Error_captureStackTrace ?
    constructorOpt =>
    {
        const obj = { };
        _Error_captureStackTrace(obj, constructorOpt);
        const stack = obj.stack.replace(/^.{5}\n/, '');
        return stack;
    } :
    () =>
    {
        const stack = _Error().stack.replace(/^(Error\n)?(?:.*\n){3}/, '');
        return stack;
    };

    function stripOwnProperties(obj)
    {
        const ownDescs = _Object_getOwnPropertyDescriptors(obj);
        const propertyKeys = _Object_keys(ownDescs);
        const undeletablePropertyKeys =
        propertyKeys.filter
        (
            propertyKey =>
            {
                // Some exotic objects may have configurable properties that cannot be deleted.
                // In Firefox, instances of CSS2Properties retrieved by the style property of HTML
                // elements are examples of such objects.
                if (ownDescs[propertyKey].configurable && _Reflect_deleteProperty(obj, propertyKey))
                    return false;
                delete ownDescs[propertyKey];
                return true;
            }
        );
        if (undeletablePropertyKeys.length)
        {
            const formattedPropertyKeys =
            formatList(undeletablePropertyKeys.map(propertyKey => _JSON_stringify(propertyKey)));
            const message =
            `The target object has undeletable properties: ${formattedPropertyKeys}`;
            console.warn(message);
        }
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
        const operation = wuwInfo && target === wuwInfo.mirror ? doMirrorSet : _Reflect_set;
        const success = operation(target, propertyKey, value, receiver);
        return success;
    }

    const wuwHandler = { get: wuwGet, set: wuwSet };
    const spyHandler = { get: spyGet, set: spySet };

    const wuwInfoMap = new WeakMap();
    const spyInfoMap = new WeakMap();

    const log = [];

    const wuw =
    wuwTarget =>
    {
        if (wuwInfoMap.has(wuwTarget))
            return;
        const ownDescs = stripOwnProperties(wuwTarget);
        const mirror = _Object_create(_Reflect_getPrototypeOf(wuwTarget), ownDescs);
        const proxy = new _Proxy(mirror, wuwHandler);
        _Reflect_setPrototypeOf(wuwTarget, proxy);
        wuwInfoMap.set(wuwTarget, { mirror });
    };

    wuw.clear =
    () =>
    {
        log.splice(0, Infinity);
    };

    wuw.snapshot =
    () =>
    {
        const snapshot = log.slice();
        return snapshot;
    };

    this.wuw = wuw;
}
