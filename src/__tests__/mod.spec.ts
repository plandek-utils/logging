import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

import { colorize as colorizeJson } from "json-colorizer";

import {
  buildPinoLogger,
  colorPrettyJSON,
  colourPrettyJSON,
  isLoggingWithRecords,
  makeColourUtils,
  makeLogging,
  makeLoggingWithRecord,
} from "../mod.ts";

describe("colorPrettyJSON()", () => {
  it("with null: returns 'null'", () => {
    expect(colorPrettyJSON(null)).toEqual(colorizeJson("null"));
    expect(colourPrettyJSON(null)).toEqual(colorizeJson("null"));
  });

  it("with 1: returns '1'", () => {
    expect(colorPrettyJSON(1)).toEqual(colorizeJson("1"));
    expect(colourPrettyJSON(1)).toEqual(colorizeJson("1"));
  });

  it("with 'abc': returns '\"abc\"'", () => {
    expect(colorPrettyJSON("abc")).toEqual(colorizeJson('"abc"'));
    expect(colourPrettyJSON("abc")).toEqual(colorizeJson('"abc"'));
  });

  it("with []: returns '[]'", () => {
    expect(colorPrettyJSON([])).toEqual(colorizeJson("[]"));
    expect(colourPrettyJSON([])).toEqual(colorizeJson("[]"));
  });

  it("with {}: returns '{}'", () => {
    expect(colorPrettyJSON({})).toEqual(colorizeJson("{}"));
    expect(colourPrettyJSON({})).toEqual(colorizeJson("{}"));
  });

  it("with { a: 1 }: returns '{ a: 1 }' formatted", () => {
    expect(colorPrettyJSON({ a: 1 })).toEqual(colorizeJson('{\n  "a": 1\n}'));
    expect(colourPrettyJSON({ a: 1 })).toEqual(colorizeJson('{\n  "a": 1\n}'));
  });
});

describe("makeColourUtils", () => {
  it('should return color functions when mode is "with-colour"', () => {
    const colorUtils = makeColourUtils("with-colour");

    expect(typeof colorUtils.blue).toBe("function");
    expect(typeof colorUtils.cyan).toBe("function");
    expect(typeof colorUtils.gray).toBe("function");
    expect(typeof colorUtils.magenta).toBe("function");
    expect(typeof colorUtils.red).toBe("function");
    expect(typeof colorUtils.yellow).toBe("function");
  });

  it('should return identity functions when mode is "plain"', () => {
    const colorUtils = makeColourUtils("plain");

    expect(colorUtils.blue("test")).toBe("test");
    expect(colorUtils.cyan("test")).toBe("test");
    expect(colorUtils.gray("test")).toBe("test");
    expect(colorUtils.magenta("test")).toBe("test");
    expect(colorUtils.red("test")).toBe("test");
    expect(colorUtils.yellow("test")).toBe("test");
  });

  it("should handle unknown modes", () => {
    // deno-lint-ignore no-explicit-any
    expect(() => makeColourUtils("unknown" as any)).toThrow();
  });
});

describe("isLoggingWithRecords", () => {
  it("should return true for LoggingWithRecords", () => {
    const logger = buildPinoLogger("debug");
    const loggingWithRecords = makeLoggingWithRecord({ logger });
    expect(isLoggingWithRecords(loggingWithRecords)).toBe(true);
  });

  it("should return false for Logging", () => {
    const logger = buildPinoLogger("debug");
    const logging = makeLogging({ logger });
    expect(isLoggingWithRecords(logging)).toBe(false);
  });
});

describe("makeLogging", () => {
  it("should create a Logging object with default settings", () => {
    const logger = buildPinoLogger("debug");
    const logging = makeLogging({ logger });
    expect(typeof logging.info).toBe("function");
    expect(typeof logging.debug).toBe("function");
    expect(typeof logging.warn).toBe("function");
    expect(typeof logging.error).toBe("function");
  });

  it("should create a Logging object with custom section", () => {
    const logger = buildPinoLogger("debug");
    const logging = makeLogging({ logger, section: "custom" });
    expect(typeof logging.info).toBe("function");
    expect(typeof logging.debug).toBe("function");
    expect(typeof logging.warn).toBe("function");
    expect(typeof logging.error).toBe("function");

    const newLogging = logging.withSection("another");
    const sameLogging = logging.withSection("custom");
    expect(newLogging).not.toBe(logging);
    expect(newLogging.getSections()).toEqual(["custom", "another"]);
    expect(sameLogging).toBe(logging);
    expect(sameLogging.getSections()).toEqual(["custom"]);
  });
});

describe("makeLoggingWithRecord", () => {
  it("should create a LoggingWithRecords object", () => {
    const logger = buildPinoLogger("debug");
    const loggingWithRecords = makeLoggingWithRecord({ logger });
    expect(loggingWithRecords.messages).toBeDefined();
    expect(typeof loggingWithRecords.info).toBe("function");
    expect(typeof loggingWithRecords.debug).toBe("function");
    expect(typeof loggingWithRecords.warn).toBe("function");
    expect(typeof loggingWithRecords.error).toBe("function");
  });

  it("should preserve existing messages", () => {
    const logger = buildPinoLogger("debug");
    const loggingWithRecords = makeLoggingWithRecord({
      logger,
      messages: { info: [["some-test", null]], warn: [["some-test-warn", { a: 1 }]], debug: [], error: [] },
    });
    loggingWithRecords.info("another test", { with: "context" });
    loggingWithRecords.warn("another test2", { with: "context2" });
    loggingWithRecords.debug("some debug");
    loggingWithRecords.error("some error");
    expect(loggingWithRecords.messages.info).toEqual([["some-test", null], ["another test", { with: "context" }]]);
    expect(loggingWithRecords.messages.warn).toEqual([["some-test-warn", { a: 1 }], ["another test2", {
      with: "context2",
    }]]);
    expect(loggingWithRecords.messages.debug).toEqual([["some debug", null]]);
    expect(loggingWithRecords.messages.error).toEqual([["some error", null]]);
  });

  it("should create a new LoggingWithRecords instance when withSection is called", () => {
    const logger = buildPinoLogger("debug");
    const loggingWithRecords = makeLoggingWithRecord({ logger, section: "first" });
    const newLoggingWithRecords = loggingWithRecords.withSection("custom");
    expect(newLoggingWithRecords).not.toBe(loggingWithRecords);
    expect(newLoggingWithRecords.getSections()).toEqual(["first", "custom"]);
    expect(newLoggingWithRecords.messages).toEqual({ info: [], warn: [], debug: [], error: [] });
  });
});