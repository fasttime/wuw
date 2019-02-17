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
    const _Reflect_getPrototypeOf           = Reflect.getPrototypeOf;
    const _Reflect_setPrototypeOf           = Reflect.setPrototypeOf;
    const _Reflect_set                      = Reflect.set;
    const _performance =
    typeof module === 'object' ? require('perf_hooks').performance : performance;

    function doMirrorSet(mirror, propertyKey, value, wuwable)
    {
        const access =
        {
            wuwable,
            propertyKey,
            stackTrace: stackTrace(),
            startTime: now(),
        };
        const prototypeProxy = _Reflect_getPrototypeOf(wuwable);
        _Reflect_setPrototypeOf(wuwable, _Reflect_getPrototypeOf(mirror));
        let success;
        let error;
        try
        {
            success = _Reflect_set(mirror, propertyKey, value, wuwable);
            access.success = success;
        }
        catch (errorCaught)
        {
            error = errorCaught;
            access.error = error;
        }
        const ownDescs = stripOwnProperties(wuwable);
        _Object_defineProperties(mirror, ownDescs);
        _Reflect_setPrototypeOf(wuwable, prototypeProxy);
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

    function setTrap(target, propertyKey, value, receiver)
    {
        const wuwableInfo = wuwableInfoMap.get(receiver);
        const operation =
        wuwableInfo && target === wuwableInfo.mirror ? doMirrorSet : _Reflect_set;
        const success = operation(target, propertyKey, value, receiver);
        return success;
    }

    const stackTrace =
    _Error_captureStackTrace ?
    () =>
    {
        const obj = { };
        _Error_captureStackTrace(obj, setTrap);
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
        const unconfigurablePropertyKeys =
        propertyKeys.filter
        (
            propertyKey =>
            {
                if (!ownDescs[propertyKey].configurable)
                {
                    delete ownDescs[propertyKey];
                    return true;
                }
                delete obj[propertyKey];
            }
        );
        if (unconfigurablePropertyKeys.length)
        {
            const formattedPropertyKeys =
            formatList(unconfigurablePropertyKeys.map(propertyKey => _JSON_stringify(propertyKey)));
            const message =
            `The target object has unconfigurable properties: ${formattedPropertyKeys}`;
            console.warn(message);
        }
        return ownDescs;
    }

    const wuwHandler = { set: setTrap };

    const wuwableInfoMap = new WeakMap();

    const log = [];

    const wuw =
    wuwable =>
    {
        if (wuwableInfoMap.has(wuwable))
            return;
        const ownDescs = stripOwnProperties(wuwable);
        const mirror = _Object_create(_Reflect_getPrototypeOf(wuwable), ownDescs);
        const proxy = new _Proxy(mirror, wuwHandler);
        _Reflect_setPrototypeOf(wuwable, proxy);
        wuwableInfoMap.set(wuwable, { mirror });
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
