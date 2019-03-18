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
    readonly splitStackTrace(): string[];
}

type WuwRecordCallback = (record: WuwRecord) => void;

type WuwWatching =
{
    readonly watch(wuwTarget: Node): wuw;
    readonly unwatch(wuwTarget: Node): wuw;
    readonly unwatchAll(): wuw;
    readonly defaultRemarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
    remarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
}

type WuwDoing =
{
    readonly do(callback: WuwRecordCallback): wuw;
    readonly dont(callback: WuwRecordCallback): wuw;
    readonly doNothing(): wuw;
    readonly isDoing(callback: WuwRecordCallback): boolean;
}

type WuwLogging =
{
    readonly log:
    {
        readonly [Symbol.iterator](): IterableIterator<WuwRecord>;
        readonly length: number;
    };
    readonly snapshot(): WuwRecord[];
    readonly clearLog(): wuw;
    loggingEnabled: boolean;
    readonly defaultMaxLogLength: number;
    maxLogLength: number;
}

type WuwLiveReporting =
{
    readonly live(): wuw;
    readonly unlive(): wuw;
    liveReportingEnabled: boolean;
}

interface wuw extends WuwWatching, WuwDoing, WuwLogging, WuwLiveReporting
{
    (wuwTarget: Node): wuw;
    readonly watching: WuwWatching;
    readonly doing: WuwDoing;
    readonly logging: WuwLogging;
    readonly liveReporting: WuwLiveReporting;
    readonly reset(): wuw;
}

declare const wuw: wuw;
