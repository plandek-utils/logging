import type { Logger as PinoLogger } from "pino";
import type { DeepReadonly } from "simplytyped";
import type { PlainObject } from "@plandek-utils/plain-object";
/**
 * Allowed log levels for the logger.
 */
export declare const LOG_LEVELS: readonly ["fatal", "error", "warn", "info", "debug", "trace", "silent"];
/**
 * Possible log levels for preparing the pino logger.
 */
export type LogLevel = (typeof LOG_LEVELS)[number];
/**
 * Parses the given log level, or returns the default level if it's not blank. If it is an invalid level it will throw an error.
 */
export declare function parseLogLevelOrDefault(level: string | null | undefined, defaultLevel: LogLevel): LogLevel;
/**
 * Prepared pino logger, returned by `buildPinoLogger` or `buildSinkLogger`.
 *
 * @see buildPinoLogger
 * @see buildSinkLogger
 */
export type PreparedLogger = Pick<PinoLogger, "level" | "info" | "debug" | "warn" | "error" | "bindings"> & {
    child: (bindings: PlainObject) => PreparedLogger;
};
/**
 * Prepares a Pino logger with the common configuration.
 *
 * @param level - The log level to use.
 * @param redactPaths - Paths to redact from the logs. Defaults to `["req.headers.authorization", "req.headers.cookie"]`.
 * @returns PinoLogger
 */
export declare function buildPinoLogger(level: LogLevel, redactPaths?: string[]): PreparedLogger;
/**
 * A mock logger that does nothing, holds no binding (sections).
 */
export declare function buildSinkLogger(level: LogLevel, givenBindings?: PlainObject): PreparedLogger;
/**
 * Util to serialise as JSON the given value, pretty-printed (2 spaces).
 */
export declare function prettyJSON(obj: unknown): string;
/**
 * Calls `prettyJSON` and then colourises the output.
 */
export declare function colourPrettyJSON(obj: unknown): string;
/**
 * Alias for `colourPrettyJSON`.
 * @see colourPrettyJSON
 */
export declare const colorPrettyJSON: typeof colourPrettyJSON;
/**
 * Interface to provide colouring for logs.
 */
export type LogColourUtils = {
    blue: (x: string) => string;
    cyan: (x: string) => string;
    gray: (x: string) => string;
    magenta: (x: string) => string;
    red: (x: string) => string;
    yellow: (x: string) => string;
};
/**
 * Creates a LogColourUtils object, with actual colours or not depending on the given mode.
 *
 * @param mode: if "with-colour", it will return a set of functions that will colour the given string. If "plain", it will return a set of functions that will return the string as is.
 */
export declare function makeColourUtils(mode: "with-colour" | "plain"): LogColourUtils;
/**
 * Logging interface. Requires a message (string) and optionally an object to log, which is required to be a Plain Object to ensure serialisation.
 */
type LogFn = (msg: string, obj?: DeepReadonly<PlainObject>) => void;
/**
 * Logging interface that provides a way to log messages with different levels. It should be configured with sections. It can return a new instance with a new section.
 */
export type Logging = {
    logger: PreparedLogger;
    info: LogFn;
    warn: LogFn;
    debug: LogFn;
    error: LogFn;
    getSections(this: Logging): string[];
    withSection(this: Logging, section: string, context?: PlainObject): Logging;
};
/**
 * Variant of the Logging interface that stores the messages that have been logged.
 */
export type LoggingWithRecords = Omit<Logging, "withSection"> & {
    withSection(this: Logging, section: string, context?: PlainObject): LoggingWithRecords;
    messages: {
        info: Array<[string, PlainObject | null]>;
        warn: Array<[string, PlainObject | null]>;
        debug: Array<[string, PlainObject | null]>;
        error: Array<[string, PlainObject | null]>;
    };
};
/**
 * Checks if the given Logging object is a LoggingWithRecords.
 * @param obj
 * @returns
 */
export declare function isLoggingWithRecords(obj: Logging): obj is LoggingWithRecords;
/**
 * Creates a Logging object. It requires an actual pino logger to be sent, and optionally a section and a context.
 */
export declare function makeLogging(opts: {
    section?: string;
    context?: PlainObject;
    logger: PreparedLogger;
}): Logging;
/**
 * Creates a LoggingWithRecords object. It requires an actual pino logger to be sent, and optionally a section and a context. You can pass it a "messages" record object to use or a new one will be created.
 */
export declare function makeLoggingWithRecord(opts: {
    logger: PreparedLogger;
    section?: string;
    context?: PlainObject;
    messages?: LoggingWithRecords["messages"];
}): LoggingWithRecords;
export {};
