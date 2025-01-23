// src/index.ts
import chalk from "chalk";
import { colorize } from "json-colorizer";
import { pino } from "pino";
var LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent"
];
function parseLogLevelOrDefault(level, defaultLevel) {
  if (!level) return defaultLevel;
  const lowerLevel = level.toLowerCase();
  if (LOG_LEVELS.includes(lowerLevel)) {
    return lowerLevel;
  }
  throw new Error(`Invalid log level: ${level}`);
}
function buildPinoLogger(level, redactPaths) {
  const paths = redactPaths ?? [
    "req.headers.authorization",
    "req.headers.cookie"
  ];
  return pino({
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: { paths, censor: "[REDACTED]" }
  });
}
function buildSinkLogger(level, givenBindings) {
  const bindings = givenBindings ?? {};
  return {
    level,
    info: () => {
    },
    debug: () => {
    },
    warn: () => {
    },
    error: () => {
    },
    child: (childBindings) => buildSinkLogger(level, { ...bindings, ...childBindings }),
    bindings: () => bindings
  };
}
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}
function colourPrettyJSON(obj) {
  return colorize(prettyJSON(obj));
}
var colorPrettyJSON = colourPrettyJSON;
function makeColourUtils(mode) {
  if (mode === "with-colour") {
    return {
      blue: (x) => chalk.blue(x),
      cyan: (x) => chalk.cyan(x),
      gray: (x) => chalk.gray(x),
      magenta: (x) => chalk.magenta(x),
      red: (x) => chalk.red(x),
      yellow: (x) => chalk.yellow(x)
    };
  }
  if (mode === "plain") {
    return {
      blue: (x) => x,
      cyan: (x) => x,
      gray: (x) => x,
      magenta: (x) => x,
      red: (x) => x,
      yellow: (x) => x
    };
  }
  const _never = mode;
  throw new Error(`Unknown mode: ${_never}`);
}
function isLoggingWithRecords(obj) {
  return "messages" in obj;
}
function makeLogging(opts) {
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
    getSections() {
      return getSectionsFromLogger(logger);
    },
    withSection(section, context) {
      if (this.getSections().includes(section)) return this;
      return makeLogging({ logger: this.logger, section, context });
    }
  };
}
function makeLoggingWithRecord(opts) {
  const logging = makeLogging(opts);
  const messages = opts.messages ?? {
    info: [],
    warn: [],
    debug: [],
    error: []
  };
  function makeLogFn(logFn, key) {
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
    getSections() {
      return logging.getSections();
    },
    withSection(section, context) {
      return makeLoggingWithRecord({
        logger: this.logger,
        section,
        messages,
        context
      });
    }
  };
}
function loggerFor(givenLogger, section, context) {
  if (!context && (!section || loggerHasSection(givenLogger, section))) {
    return givenLogger;
  }
  const childBindings = { ...context };
  if (section) {
    childBindings.logSections = [
      ...getSectionsFromLogger(givenLogger),
      section
    ];
  }
  return givenLogger.child(childBindings);
}
function getSectionsFromLogger(logger) {
  return logger.bindings().logSections ?? [];
}
function loggerHasSection(logger, section) {
  const sections = getSectionsFromLogger(logger);
  return sections.includes(section);
}
export {
  LOG_LEVELS,
  buildPinoLogger,
  buildSinkLogger,
  colorPrettyJSON,
  colourPrettyJSON,
  isLoggingWithRecords,
  makeColourUtils,
  makeLogging,
  makeLoggingWithRecord,
  parseLogLevelOrDefault,
  prettyJSON
};
//# sourceMappingURL=index.mjs.map