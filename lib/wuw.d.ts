type RemarkUndeletablePropertiesFunction =
(wuwTarget: Node, undeletablePropertyKeys: (string | symbol)[]) => void;

interface WuwRecord
{
    readonly target: object;
    readonly propertyKey: string | symbol;
    readonly stackTrace: string;
    readonly startTime: number;
    readonly endTime: number;
    readonly success?: boolean;
    readonly error?: any;
    splitStackTrace(): string[];
}

type WuwRecordCallback = (record: WuwRecord) => void;

type WuwWatching =
{
    watch(wuwTarget: Node): wuw;
    unwatch(wuwTarget: Node): wuw;
    unwatchAll(): wuw;
    readonly defaultRemarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
    remarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
}

type WuwDoing =
{
    do(callback: WuwRecordCallback): wuw;
    dont(callback: WuwRecordCallback): wuw;
    doNothing(): wuw;
    isDoing(callback: WuwRecordCallback): boolean;
}

type WuwLogging =
{
    readonly log:
    {
        [Symbol.iterator](): IterableIterator<WuwRecord>;
        readonly length: number;
    };
    snapshot(): WuwRecord[];
    clearLog(): wuw;
    loggingEnabled: boolean;
    readonly defaultMaxLogLength: number;
    maxLogLength: number;
}

type WuwLiveReporting =
{
    live(): wuw;
    unlive(): wuw;
    liveReportingEnabled: boolean;
}

interface wuw extends WuwWatching, WuwDoing, WuwLogging, WuwLiveReporting
{
    (wuwTarget: Node): wuw;
    readonly watching: WuwWatching;
    readonly doing: WuwDoing;
    readonly logging: WuwLogging;
    readonly liveReporting: WuwLiveReporting;
    reset(): wuw;
}

declare const wuw: wuw;
