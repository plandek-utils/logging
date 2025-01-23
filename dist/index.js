"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  LOG_LEVELS: () => LOG_LEVELS,
  buildPinoLogger: () => buildPinoLogger,
  buildSinkLogger: () => buildSinkLogger,
  colorPrettyJSON: () => colorPrettyJSON,
  colourPrettyJSON: () => colourPrettyJSON,
  isLoggingWithRecords: () => isLoggingWithRecords,
  makeColourUtils: () => makeColourUtils,
  makeLogging: () => makeLogging,
  makeLoggingWithRecord: () => makeLoggingWithRecord,
  parseLogLevelOrDefault: () => parseLogLevelOrDefault,
  prettyJSON: () => prettyJSON
});
module.exports = __toCommonJS(index_exports);
var import_chalk = __toESM(require("chalk"));
var import_json_colorizer = require("json-colorizer");
var import_pino = require("pino");
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
  return (0, import_pino.pino)({
    level,
    timestamp: import_pino.pino.stdTimeFunctions.isoTime,
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
  return (0, import_json_colorizer.colorize)(prettyJSON(obj));
}
var colorPrettyJSON = colourPrettyJSON;
function makeColourUtils(mode) {
  if (mode === "with-colour") {
    return {
      blue: (x) => import_chalk.default.blue(x),
      cyan: (x) => import_chalk.default.cyan(x),
      gray: (x) => import_chalk.default.gray(x),
      magenta: (x) => import_chalk.default.magenta(x),
      red: (x) => import_chalk.default.red(x),
      yellow: (x) => import_chalk.default.yellow(x)
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.js.map