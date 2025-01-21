# @plandek-utils/logging

[![npm version](https://badge.fury.io/js/%40plandek-utils%2Flogging.svg)](https://badge.fury.io/js/%40plandek-utils%2Flogging)
[![Maintainability](https://api.codeclimate.com/v1/badges/4d6e32a1b993723d7c4f/maintainability)](https://codeclimate.com/github/plandek-utils/logging/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/4d6e32a1b993723d7c4f/test_coverage)](https://codeclimate.com/github/plandek-utils/logging/test_coverage)

TypeScript utils for Logging. Includes prettifying of JSON, logging utils, and colour utils.

## Installation

```bash
npm install @plandek-utils/logging
```

## Usage

### Pretty JSON: `prettyJSON` and `colorPrettyJSON` or `colourPrettyJSON`

```ts
import { prettyJSON } from "@plandek-utils/logging";

const obj = { name: "John", age: 30 };
console.log(prettyJSON(obj)); // OUTPUT: {\n  "name": "John",\n  "age": 30\n}
```

```ts
import { colorPrettyJSON } from "@plandek-utils/logging";

const obj = { name: "John", age: 30 };
console.log(colorPrettyJSON(obj));
```

output:

```
"\x1b[90m{\x1b[39m\x1b[90m\n" +
  '  \x1b[39m\x1b[35m"name"\x1b[39m\x1b[90m:\x1b[39m\x1b[90m \x1b[39m\x1b[33m"John"\x1b[39m\x1b[90m,\x1b[39m\x1b[90m\n' +
  '  \x1b[39m\x1b[35m"age"\x1b[39m\x1b[90m:\x1b[39m\x1b[90m \x1b[39m\x1b[32m30\x1b[39m\x1b[90m\n' +
  "\x1b[39m\x1b[90m}\x1b[39m"
```

You can use `colorPrettyJSON` or `colourPrettyJSON` (alias).

### `makeColourUtils(mode: "with-colour" | "plain"): LogColourUtils`

Creates a utility object for colouring log messages using CHALK.

```ts
import { makeColourUtils } from "@plandek-utils/logging";

const colorUtils = makeColourUtils("with-colour");
console.log(colorUtils.blue("Hello"));

const plainColorUtils = makeColourUtils("plain");
console.log(plainColorUtils.blue("Hello")); // Output: Hello as is.
```

### Loggers

- for real: `buildPinoLogger(level: LevelWithSilent, redactPaths?: string[]): PreparedLogger`
- for test: `buildSinkLogger(level: LevelWithSilent, bindings?: PlainObject): PreparedLogger`
- parse log level: `parseLogLevelOrDefault(x: string): LogLevel`

Creates a Pino logger with common configuration.

```ts
import { buildPinoLogger, buildSinkLogger, parseLogLevelOrDefault } from "@plandek-utils/logging";

const level = parseLogLevelOrDefault(process.env.LOG_LEVEL, "info"); // gets the log level if present, otherwise info. If the LOG_LEVEL is not a valid one it will throw.
const logger = buildPinoLogger(level, ["req.headers.authorization"]);

const testLogger = buildSinkLogger(level); // does not send any log -> useful for tests.

logger.info({ req: { headers: { authorization: "Bearer token" } } }, "User logged in");
// {"level":30,"time":"2024-10-28T11:10:58.250Z","pid":18166,"hostname":"044ce1509ebe","req":{"headers":{"authorization":"[REDACTED]"}},"msg":"User logged in"}

logger.info("Hi!");
// {"level":30,"time":"2024-10-28T11:12:48.732Z","pid":18166,"hostname":"044ce1509ebe","msg":"Hi!"}
```

### `makeLogging`

```ts
import { makeLogging } from "@plandek-utils/logging";

const logger = buildPinoLogger("info");
const logging = makeLogging({ logger, section: "api" });

logging.info("User logged in", { userId: 123 });
// {"level":30,"time":"2024-10-28T11:14:13.519Z","pid":18166,"hostname":"044ce1509ebe","logSections":["api"],"userId":123,"msg":"User logged in"}

logging.withSection("database").debug("Query executed");
// no output since `debug` is not enabled in the logger

logging.withSection("database").error("Query failed");
// {"level":50,"time":"2024-10-28T11:14:59.509Z","pid":18166,"hostname":"044ce1509ebe","logSections":["api"],"logSections":["api","database"],"msg":"Query failed"}
```

### `makeLoggingWithRecord`

Same as `makeLogging`, but keeping an in-memory record of all messages (and contexts) sent. This is meant for testing
purposes.

```ts
import { makeLoggingWithRecord, type PreparedLogger } from "@plandek-utils/logging";

const logger: PreparedLogger = buildPinoLogger("info");
const loggingWithRecords = makeLoggingWithRecord({ logger, section: "api" });

loggingWithRecords.info("User logged in", { userId: 123 });
// {"level":30,"time":"2024-10-28T11:16:49.607Z","pid":18166,"hostname":"044ce1509ebe","logSections":["api"],"userId":123,"msg":"User logged in"}

console.log(loggingWithRecords.messages.info);
// [ [ "User logged in", { userId: 123 } ] ]
```

## Development

This package is developed with TypeScript and uses Vitest for testing.

- `npm run build`: build the package
- `npm test`: run tests
- `npm run test:watch`: run tests in watch mode
- `npm run test:coverage`: run tests with coverage
- `npm run lint`: lint files
- `npm run format`: format files

## License

MIT License - see LICENSE file
