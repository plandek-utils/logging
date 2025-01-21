import type { Logger as PinoLogger } from "pino";
import { pino } from "pino";
import type { DeepReadonly } from "simplytyped";
import { colorize } from "json-colorizer";
import chalk from "chalk";

import type {
  PlainObject,
  PlainObjectValue,
} from "@plandek-utils/plain-object";

/**
 * Allowed log levels for the logger.
 */
export const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

/**
 * Possible log levels for preparing the pino logger.
 */
export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Parses the given log level, or returns the default level if it's not blank. If it is an invalid level it will throw an error.
 */
export function parseLogLevelOrDefault(
  level: string | null | undefined,
  defaultLevel: LogLevel
): LogLevel {
  if (!level) return defaultLevel;

  const lowerLevel = level.toLowerCase() as LogLevel;
  if (LOG_LEVELS.includes(lowerLevel)) {
    return lowerLevel;
  }

  throw new Error(`Invalid log level: ${level}`);
}

/**
 * Prepared pino logger, returned by `buildPinoLogger` or `buildSinkLogger`.
 *
 * @see buildPinoLogger
 * @see buildSinkLogger
 */
export type PreparedLogger = Pick<
  PinoLogger,
  "level" | "info" | "debug" | "warn" | "error" | "bindings"
> & {
  child: (bindings: PlainObject) => PreparedLogger;
};

/**
 * Prepares a Pino logger with the common configuration.
 *
 * @param level - The log level to use.
 * @param redactPaths - Paths to redact from the logs. Defaults to `["req.headers.authorization", "req.headers.cookie"]`.
 * @returns PinoLogger
 */
export function buildPinoLogger(
  level: LogLevel,
  redactPaths?: string[]
): PreparedLogger {
  const paths = redactPaths ?? [
    "req.headers.authorization",
    "req.headers.cookie",
  ];
  return pino({
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths, censor: "[REDACTED]" },
  });
}

/**
 * A mock logger that does nothing, holds no binding (sections).
 */
export function buildSinkLogger(
  level: LogLevel,
  givenBindings?: PlainObject
): PreparedLogger {
  const bindings = givenBindings ?? {};
  return {
    level,
    info: () => {},
    debug: () => {},
    warn: () => {},
    error: () => {},
    child: (childBindings?: PlainObject) =>
      buildSinkLogger(level, { ...bindings, ...childBindings }),
    bindings: () => bindings,
  };
}

/**
 * Util to serialise as JSON the given value, pretty-printed (2 spaces).
 */
export function prettyJSON(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

/**
 * Calls `prettyJSON` and then colourises the output.
 */
export function colourPrettyJSON(obj: unknown): string {
  return colorize(prettyJSON(obj));
}

/**
 * Alias for `colourPrettyJSON`.
 * @see colourPrettyJSON
 */
export const colorPrettyJSON = colourPrettyJSON;

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
export function makeColourUtils(mode: "with-colour" | "plain"): LogColourUtils {
  if (mode === "with-colour") {
    return {
      blue: (x: string) => chalk.blue(x),
      cyan: (x: string) => chalk.cyan(x),
      gray: (x: string) => chalk.gray(x),
      magenta: (x: string) => chalk.magenta(x),
      red: (x: string) => chalk.red(x),
      yellow: (x: string) => chalk.yellow(x),
    };
  }

  if (mode === "plain") {
    return {
      blue: (x: string) => x,
      cyan: (x: string) => x,
      gray: (x: string) => x,
      magenta: (x: string) => x,
      red: (x: string) => x,
      yellow: (x: string) => x,
    };
  }

  const _never: never = mode;
  throw new Error(`Unknown mode: ${_never}`);
}

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
  withSection(
    this: Logging,
    section: string,
    context?: PlainObject
  ): LoggingWithRecords;
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
export function isLoggingWithRecords(obj: Logging): obj is LoggingWithRecords {
  return "messages" in obj;
}

/**
 * Creates a Logging object. It requires an actual pino logger to be sent, and optionally a section and a context.
 */
export function makeLogging(opts: {
  section?: string;
  context?: PlainObject;
  logger: PreparedLogger;
}): Logging {
  const logger = loggerFor(
    opts.logger,
    opts.section ?? null,
    opts.context ?? null
  );

  return {
    logger,
    info: (msg, obj) => logger.info(obj, msg),
    debug: (msg, obj) => logger.debug(obj, msg),
    warn: (msg, obj) => logger.warn(obj, msg),
    error: (msg, obj) => logger.error(obj, msg),
    getSections(): string[] {
      return getSectionsFromLogger(logger);
    },
    withSection(section, context) {
      if (this.getSections().includes(section)) return this;

      return makeLogging({ logger: this.logger, section, context });
    },
  };
}

/**
 * Creates a LoggingWithRecords object. It requires an actual pino logger to be sent, and optionally a section and a context. You can pass it a "messages" record object to use or a new one will be created.
 */
export function makeLoggingWithRecord(opts: {
  logger: PreparedLogger;
  section?: string;
  context?: PlainObject;
  messages?: LoggingWithRecords["messages"];
}): LoggingWithRecords {
  const logging = makeLogging(opts);
  const messages = opts.messages ?? {
    info: [],
    warn: [],
    debug: [],
    error: [],
  };

  function makeLogFn(logFn: LogFn, key: keyof typeof messages): LogFn {
    return (msg, obj) => {
      messages[key].push([msg, obj ?? null]);
      return logFn(msg, obj);
    };
  }

  return {
    messages,
    logger: logging.logger,
    info: makeLogFn(logging.info, "info"),
    debug: makeLogFn(logging.debug, "debug"),
    warn: makeLogFn(logging.warn, "warn"),
    error: makeLogFn(logging.error, "error"),
    getSections(): string[] {
      return logging.getSections();
    },
    withSection(section, context) {
      return makeLoggingWithRecord({
        logger: this.logger,
        section,
        messages,
        context,
      });
    },
  };
}

// INTERNAL

function loggerFor(
  givenLogger: PreparedLogger,
  section: string | null,
  context: PlainObject | null
) {
  if (!context && (!section || loggerHasSection(givenLogger, section))) {
    return givenLogger;
  }

  const childBindings: Record<string, PlainObjectValue> = { ...context };
  if (section) {
    childBindings["logSections"] = [
      ...getSectionsFromLogger(givenLogger),
      section,
    ];
  }

  return givenLogger.child(childBindings);
}

function getSectionsFromLogger(logger: PreparedLogger) {
  return logger.bindings()["logSections"] ?? [];
}

function loggerHasSection(logger: PreparedLogger, section: string) {
  const sections = getSectionsFromLogger(logger);
  return sections.includes(section);
}
