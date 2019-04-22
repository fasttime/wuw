export type RemarkUndeletablePropertiesFunction =
(wuwTarget: Node, undeletablePropertyKeys: (string | symbol)[]) => void;

export interface WuwRecord
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

export type WuwRecordCallback = (record: WuwRecord) => void;

export interface WuwWatching
{
    readonly defaultRemarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
    remarkUndeletableProperties: RemarkUndeletablePropertiesFunction;
    watch(wuwTarget: Node): wuw;
    unwatch(wuwTarget: Node): wuw;
    unwatchAll(): wuw;
}

export interface WuwDoing
{
    do(callback: WuwRecordCallback): wuw;
    dont(callback: WuwRecordCallback): wuw;
    doNothing(): wuw;
    isDoing(callback: WuwRecordCallback): boolean;
}

export interface WuwLogging
{
    readonly log:
    {
        readonly length: number;
        [Symbol.iterator](): IterableIterator<WuwRecord>;
    };
    loggingEnabled: boolean;
    readonly defaultMaxLogLength: number;
    maxLogLength: number;
    snapshot(): WuwRecord[];
    clearLog(): wuw;
}

export interface WuwLiveReporting
{
    liveReportingEnabled: boolean;
    live(): wuw;
    unlive(): wuw;
}

export interface wuw extends WuwWatching, WuwDoing, WuwLogging, WuwLiveReporting
{
    readonly watching: WuwWatching;
    readonly doing: WuwDoing;
    readonly logging: WuwLogging;
    readonly liveReporting: WuwLiveReporting;
    (wuwTarget: Node): wuw;
    reset(): wuw;
}

declare global { const wuw: wuw; }
