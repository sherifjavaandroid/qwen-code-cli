// src/lib/logger.ts
import path5 from "path";
import _util from "util";
import "colors";
import _5 from "lodash";
import fs4 from "fs-extra";
import { format as dateFormat2 } from "date-fns";

// src/lib/configs/service-config.ts
import path3 from "path";
import fs2 from "fs-extra";
import yaml from "yaml";
import _3 from "lodash";

// src/lib/environment.ts
import path from "path";
import fs from "fs-extra";
import minimist from "minimist";
import _ from "lodash";
var cmdArgs = minimist(process.argv.slice(2));
var envVars = process.env;
var Environment = class {
  /** 命令行参数 */
  cmdArgs;
  /** 环境变量 */
  envVars;
  /** 环境名称 */
  env;
  /** 服务名称 */
  name;
  /** 服务地址 */
  host;
  /** 服务端口 */
  port;
  /** 包参数 */
  package;
  constructor(options = {}) {
    const { cmdArgs: cmdArgs2, envVars: envVars2, package: _package } = options;
    this.cmdArgs = cmdArgs2;
    this.envVars = envVars2;
    this.env = _.defaultTo(cmdArgs2.env || envVars2.SERVER_ENV, "dev");
    this.name = cmdArgs2.name || envVars2.SERVER_NAME || void 0;
    this.host = cmdArgs2.host || envVars2.SERVER_HOST || void 0;
    this.port = Number(cmdArgs2.port || envVars2.SERVER_PORT) ? Number(cmdArgs2.port || envVars2.SERVER_PORT) : void 0;
    this.package = _package;
  }
};
var environment_default = new Environment({
  cmdArgs,
  envVars,
  package: JSON.parse(fs.readFileSync(path.join(path.resolve(), "package.json")).toString())
});

// src/lib/util.ts
import os from "os";
import path2 from "path";
import crypto from "crypto";
import { Readable, Writable } from "stream";
import "colors";
import mime from "mime";
import axios from "axios";
import { v1 as uuid } from "uuid";
import { format as dateFormat } from "date-fns";
import CRC32 from "crc-32";
import randomstring from "randomstring";
import _2 from "lodash";
import { CronJob } from "cron";

// src/lib/http-status-codes.ts
var http_status_codes_default = {
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFO: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTIPLE_STATUS: 207,
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  UNUSED: 306,
  TEMPORARY_REDIRECT: 307,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NO_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  REQUEST_ENTITY_TOO_LARGE: 413,
  REQUEST_URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  REQUESTED_RANGE_NOT_SATISFIABLE: 416,
  EXPECTION_FAILED: 417,
  TOO_MANY_CONNECTIONS: 421,
  UNPROCESSABLE_ENTITY: 422,
  FAILED_DEPENDENCY: 424,
  UNORDERED_COLLECTION: 425,
  UPGRADE_REQUIRED: 426,
  RETRY_WITH: 449,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  BANDWIDTH_LIMIT_EXCEEDED: 509,
  NOT_EXTENDED: 510
};

// src/lib/util.ts
var autoIdMap = /* @__PURE__ */ new Map();
var util = {
  is2DArrays(value) {
    return _2.isArray(value) && (!value[0] || _2.isArray(value[0]) && _2.isArray(value[value.length - 1]));
  },
  uuid: (separator = true) => separator ? uuid() : uuid().replace(/\-/g, ""),
  autoId: (prefix = "") => {
    let index = autoIdMap.get(prefix);
    if (index > 999999) index = 0;
    autoIdMap.set(prefix, (index || 0) + 1);
    return `${prefix}${index || 1}`;
  },
  ignoreJSONParse(value) {
    const result = _2.attempt(() => JSON.parse(value));
    if (_2.isError(result)) return null;
    return result;
  },
  generateRandomString(options) {
    return randomstring.generate(options);
  },
  getResponseContentType(value) {
    return value.headers ? value.headers["content-type"] || value.headers["Content-Type"] : null;
  },
  mimeToExtension(value) {
    let extension = mime.getExtension(value);
    if (extension == "mpga") return "mp3";
    return extension;
  },
  extractURLExtension(value) {
    const extname = path2.extname(new URL(value).pathname);
    return extname.substring(1).toLowerCase();
  },
  createCronJob(cronPatterns, callback) {
    if (!_2.isFunction(callback))
      throw new Error("callback must be an Function");
    return new CronJob(
      cronPatterns,
      () => callback(),
      null,
      false,
      "Asia/Shanghai"
    );
  },
  getDateString(format = "yyyy-MM-dd", date = /* @__PURE__ */ new Date()) {
    return dateFormat(date, format);
  },
  getIPAddressesByIPv4() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (let name in interfaces) {
      const networks = interfaces[name];
      const results = networks.filter(
        (network) => network.family === "IPv4" && network.address !== "127.0.0.1" && !network.internal
      );
      if (results[0] && results[0].address) addresses.push(results[0].address);
    }
    return addresses;
  },
  getMACAddressesByIPv4() {
    const interfaces = os.networkInterfaces();
    const addresses = [];
    for (let name in interfaces) {
      const networks = interfaces[name];
      const results = networks.filter(
        (network) => network.family === "IPv4" && network.address !== "127.0.0.1" && !network.internal
      );
      if (results[0] && results[0].mac) addresses.push(results[0].mac);
    }
    return addresses;
  },
  generateSSEData(event, data, retry) {
    return `event: ${event || "message"}
data: ${(data || "").replace(/\n/g, "\\n").replace(/\s/g, "\\s")}
retry: ${retry || 3e3}

`;
  },
  buildDataBASE64(type, ext, buffer) {
    return `data:${type}/${ext.replace("jpg", "jpeg")};base64,${buffer.toString(
      "base64"
    )}`;
  },
  isLinux() {
    return os.platform() !== "win32";
  },
  isIPAddress(value) {
    return _2.isString(value) && (/^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)$/.test(
      value
    ) || /\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*/.test(
      value
    ));
  },
  isPort(value) {
    return _2.isNumber(value) && value > 0 && value < 65536;
  },
  isReadStream(value) {
    return value && (value instanceof Readable || "readable" in value || value.readable);
  },
  isWriteStream(value) {
    return value && (value instanceof Writable || "writable" in value || value.writable);
  },
  isHttpStatusCode(value) {
    return _2.isNumber(value) && Object.values(http_status_codes_default).includes(value);
  },
  isURL(value) {
    return !_2.isUndefined(value) && /^(http|https)/.test(value);
  },
  isSrc(value) {
    return !_2.isUndefined(value) && /^\/.+\.[0-9a-zA-Z]+(\?.+)?$/.test(value);
  },
  isBASE64(value) {
    return !_2.isUndefined(value) && /^[a-zA-Z0-9\/\+]+(=?)+$/.test(value);
  },
  isBASE64Data(value) {
    return /^data:/.test(value);
  },
  extractBASE64DataFormat(value) {
    const match = value.trim().match(/^data:(.+);base64,/);
    if (!match) return null;
    return match[1];
  },
  removeBASE64DataHeader(value) {
    return value.replace(/^data:(.+);base64,/, "");
  },
  isDataString(value) {
    return /^(base64|json):/.test(value);
  },
  isStringNumber(value) {
    return _2.isFinite(Number(value));
  },
  isUnixTimestamp(value) {
    return /^[0-9]{10}$/.test(`${value}`);
  },
  isTimestamp(value) {
    return /^[0-9]{13}$/.test(`${value}`);
  },
  isEmail(value) {
    return /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/.test(
      value
    );
  },
  isAsyncFunction(value) {
    return Object.prototype.toString.call(value) === "[object AsyncFunction]";
  },
  unixTimestamp() {
    return parseInt(`${Date.now() / 1e3}`);
  },
  timestamp() {
    return Date.now();
  },
  urlJoin(...values) {
    let url = "";
    for (let i = 0; i < values.length; i++)
      url += `${i > 0 ? "/" : ""}${values[i].replace(/^\/*/, "").replace(/\/*$/, "")}`;
    return url;
  },
  millisecondsToHmss(milliseconds) {
    if (_2.isString(milliseconds)) return milliseconds;
    milliseconds = parseInt(milliseconds);
    const sec = Math.floor(milliseconds / 1e3);
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec - hours * 3600) / 60);
    const seconds = sec - hours * 3600 - minutes * 60;
    const ms = milliseconds % 6e4 - seconds * 1e3;
    return `${hours > 9 ? hours : "0" + hours}:${minutes > 9 ? minutes : "0" + minutes}:${seconds > 9 ? seconds : "0" + seconds}.${ms}`;
  },
  millisecondsToTimeString(milliseconds) {
    if (milliseconds < 1e3) return `${milliseconds}ms`;
    if (milliseconds < 6e4)
      return `${parseFloat((milliseconds / 1e3).toFixed(2))}s`;
    return `${Math.floor(milliseconds / 1e3 / 60)}m${Math.floor(
      milliseconds / 1e3 % 60
    )}s`;
  },
  md5(value) {
    return crypto.createHash("md5").update(value).digest("hex");
  },
  crc32(value) {
    return _2.isBuffer(value) ? CRC32.buf(value) : CRC32.str(value);
  },
  arrayParse(value) {
    return _2.isArray(value) ? value : [value];
  },
  booleanParse(value) {
    return value === "true" || value === true ? true : false;
  },
  encodeBASE64(value) {
    return Buffer.from(value).toString("base64");
  },
  decodeBASE64(value) {
    return Buffer.from(value, "base64").toString();
  },
  async fetchFileBASE64(url) {
    const result = await axios.get(url, {
      responseType: "arraybuffer"
    });
    return result.data.toString("base64");
  }
};
var util_default = util;

// src/lib/configs/service-config.ts
var CONFIG_PATH = path3.join(path3.resolve(), "configs/", environment_default.env, "/service.yml");
var ServiceConfig = class _ServiceConfig {
  /** 服务名称 */
  name;
  /** 服务绑定主机地址 */
  host;
  /** 服务绑定端口 */
  port;
  /** 服务路由前缀 */
  urlPrefix;
  /** 服务绑定地址（外部访问地址） */
  bindAddress;
  constructor(options) {
    const { name, host, port, urlPrefix, bindAddress } = options || {};
    this.name = _3.defaultTo(name, "qwen-free-api");
    this.host = _3.defaultTo(host, "0.0.0.0");
    this.port = _3.defaultTo(port, 5566);
    this.urlPrefix = _3.defaultTo(urlPrefix, "");
    this.bindAddress = bindAddress;
  }
  get addressHost() {
    if (this.bindAddress) return this.bindAddress;
    const ipAddresses = util_default.getIPAddressesByIPv4();
    for (let ipAddress of ipAddresses) {
      if (ipAddress === this.host)
        return ipAddress;
    }
    return ipAddresses[0] || "127.0.0.1";
  }
  get address() {
    return `${this.addressHost}:${this.port}`;
  }
  get pageDirUrl() {
    return `http://127.0.0.1:${this.port}/page`;
  }
  get publicDirUrl() {
    return `http://127.0.0.1:${this.port}/public`;
  }
  static load() {
    const external = _3.pickBy(environment_default, (v, k) => ["name", "host", "port"].includes(k) && !_3.isUndefined(v));
    if (!fs2.pathExistsSync(CONFIG_PATH)) return new _ServiceConfig(external);
    const data = yaml.parse(fs2.readFileSync(CONFIG_PATH).toString());
    return new _ServiceConfig({ ...data, ...external });
  }
};
var service_config_default = ServiceConfig.load();

// src/lib/configs/system-config.ts
import path4 from "path";
import fs3 from "fs-extra";
import yaml2 from "yaml";
import _4 from "lodash";
var CONFIG_PATH2 = path4.join(path4.resolve(), "configs/", environment_default.env, "/system.yml");
var SystemConfig = class _SystemConfig {
  /** 是否开启请求日志 */
  requestLog;
  /** 临时目录路径 */
  tmpDir;
  /** 日志目录路径 */
  logDir;
  /** 日志写入间隔（毫秒） */
  logWriteInterval;
  /** 日志文件有效期（毫秒） */
  logFileExpires;
  /** 公共目录路径 */
  publicDir;
  /** 临时文件有效期（毫秒） */
  tmpFileExpires;
  /** 请求体配置 */
  requestBody;
  /** 是否调试模式 */
  debug;
  constructor(options) {
    const { requestLog, tmpDir, logDir, logWriteInterval, logFileExpires, publicDir, tmpFileExpires, requestBody, debug } = options || {};
    this.requestLog = _4.defaultTo(requestLog, false);
    this.tmpDir = _4.defaultTo(tmpDir, "./tmp");
    this.logDir = _4.defaultTo(logDir, "./logs");
    this.logWriteInterval = _4.defaultTo(logWriteInterval, 200);
    this.logFileExpires = _4.defaultTo(logFileExpires, 262656e4);
    this.publicDir = _4.defaultTo(publicDir, "./public");
    this.tmpFileExpires = _4.defaultTo(tmpFileExpires, 864e5);
    this.requestBody = Object.assign(requestBody || {}, {
      enableTypes: ["json", "form", "text", "xml"],
      encoding: "utf-8",
      formLimit: "100mb",
      jsonLimit: "100mb",
      textLimit: "100mb",
      xmlLimit: "100mb",
      formidable: {
        maxFileSize: "100mb"
      },
      multipart: true,
      parsedMethods: ["POST", "PUT", "PATCH"]
    });
    this.debug = _4.defaultTo(debug, true);
  }
  get rootDirPath() {
    return path4.resolve();
  }
  get tmpDirPath() {
    return path4.resolve(this.tmpDir);
  }
  get logDirPath() {
    return path4.resolve(this.logDir);
  }
  get publicDirPath() {
    return path4.resolve(this.publicDir);
  }
  static load() {
    if (!fs3.pathExistsSync(CONFIG_PATH2)) return new _SystemConfig();
    const data = yaml2.parse(fs3.readFileSync(CONFIG_PATH2).toString());
    return new _SystemConfig(data);
  }
};
var system_config_default = SystemConfig.load();

// src/lib/config.ts
var Config = class {
  /** 服务配置 */
  service = service_config_default;
  /** 系统配置 */
  system = system_config_default;
};
var config_default = new Config();

// src/lib/logger.ts
var isVercelEnv = process.env.VERCEL;
var LogWriter = class {
  #buffers = [];
  constructor() {
    !isVercelEnv && fs4.ensureDirSync(config_default.system.logDirPath);
    !isVercelEnv && this.work();
  }
  push(content) {
    const buffer = Buffer.from(content);
    this.#buffers.push(buffer);
  }
  writeSync(buffer) {
    !isVercelEnv && fs4.appendFileSync(path5.join(config_default.system.logDirPath, `/${util_default.getDateString()}.log`), buffer);
  }
  async write(buffer) {
    !isVercelEnv && await fs4.appendFile(path5.join(config_default.system.logDirPath, `/${util_default.getDateString()}.log`), buffer);
  }
  flush() {
    if (!this.#buffers.length) return;
    !isVercelEnv && fs4.appendFileSync(path5.join(config_default.system.logDirPath, `/${util_default.getDateString()}.log`), Buffer.concat(this.#buffers));
  }
  work() {
    if (!this.#buffers.length) return setTimeout(this.work.bind(this), config_default.system.logWriteInterval);
    const buffer = Buffer.concat(this.#buffers);
    this.#buffers = [];
    this.write(buffer).finally(() => setTimeout(this.work.bind(this), config_default.system.logWriteInterval)).catch((err) => console.error("Log write error:", err));
  }
};
var LogText = class {
  level;
  text;
  source;
  time = /* @__PURE__ */ new Date();
  constructor(level, ...params) {
    this.level = level;
    this.text = _util.format.apply(null, params);
    this.source = this.#getStackTopCodeInfo();
  }
  #getStackTopCodeInfo() {
    const unknownInfo = { name: "unknown", codeLine: 0, codeColumn: 0 };
    const stackArray = new Error().stack.split("\n");
    const text = stackArray[4];
    if (!text)
      return unknownInfo;
    const match = text.match(/at (.+) \((.+)\)/) || text.match(/at (.+)/);
    if (!match || !_5.isString(match[2] || match[1]))
      return unknownInfo;
    const temp = match[2] || match[1];
    const _match = temp.match(/([a-zA-Z0-9_\-\.]+)\:(\d+)\:(\d+)$/);
    if (!_match)
      return unknownInfo;
    const [, scriptPath, codeLine, codeColumn] = _match;
    return {
      name: scriptPath ? scriptPath.replace(/.js$/, "") : "unknown",
      path: scriptPath || null,
      codeLine: parseInt(codeLine || 0),
      codeColumn: parseInt(codeColumn || 0)
    };
  }
  toString() {
    return `[${dateFormat2(this.time, "yyyy-MM-dd HH:mm:ss.SSS")}][${this.level}][${this.source.name}<${this.source.codeLine},${this.source.codeColumn}>] ${this.text}`;
  }
};
var Logger = class _Logger {
  config = {};
  static Level = {
    Success: "success",
    Info: "info",
    Log: "log",
    Debug: "debug",
    Warning: "warning",
    Error: "error",
    Fatal: "fatal"
  };
  static LevelColor = {
    [_Logger.Level.Success]: "green",
    [_Logger.Level.Info]: "brightCyan",
    [_Logger.Level.Debug]: "white",
    [_Logger.Level.Warning]: "brightYellow",
    [_Logger.Level.Error]: "brightRed",
    [_Logger.Level.Fatal]: "red"
  };
  #writer;
  constructor() {
    this.#writer = new LogWriter();
  }
  header() {
    this.#writer.writeSync(Buffer.from(`

===================== LOG START ${dateFormat2(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mm:ss.SSS")} =====================

`));
  }
  footer() {
    this.#writer.flush();
    this.#writer.writeSync(Buffer.from(`

===================== LOG END ${dateFormat2(/* @__PURE__ */ new Date(), "yyyy-MM-dd HH:mm:ss.SSS")} =====================

`));
  }
  success(...params) {
    const content = new LogText(_Logger.Level.Success, ...params).toString();
    console.info(content[_Logger.LevelColor[_Logger.Level.Success]]);
    this.#writer.push(content + "\n");
  }
  info(...params) {
    const content = new LogText(_Logger.Level.Info, ...params).toString();
    console.info(content[_Logger.LevelColor[_Logger.Level.Info]]);
    this.#writer.push(content + "\n");
  }
  log(...params) {
    const content = new LogText(_Logger.Level.Log, ...params).toString();
    console.log(content[_Logger.LevelColor[_Logger.Level.Log]]);
    this.#writer.push(content + "\n");
  }
  debug(...params) {
    if (!config_default.system.debug) return;
    const content = new LogText(_Logger.Level.Debug, ...params).toString();
    console.debug(content[_Logger.LevelColor[_Logger.Level.Debug]]);
    this.#writer.push(content + "\n");
  }
  warn(...params) {
    const content = new LogText(_Logger.Level.Warning, ...params).toString();
    console.warn(content[_Logger.LevelColor[_Logger.Level.Warning]]);
    this.#writer.push(content + "\n");
  }
  error(...params) {
    const content = new LogText(_Logger.Level.Error, ...params).toString();
    console.error(content[_Logger.LevelColor[_Logger.Level.Error]]);
    this.#writer.push(content);
  }
  fatal(...params) {
    const content = new LogText(_Logger.Level.Fatal, ...params).toString();
    console.error(content[_Logger.LevelColor[_Logger.Level.Fatal]]);
    this.#writer.push(content);
  }
  destory() {
    this.#writer.destory();
  }
};
var logger_default = new Logger();

// src/lib/initialize.ts
process.setMaxListeners(Infinity);
process.on("uncaughtException", (err, origin) => {
  logger_default.error(`An unhandled error occurred: ${origin}`, err);
});
process.on("unhandledRejection", (_16, promise) => {
  promise.catch((err) => logger_default.error("An unhandled rejection occurred:", err));
});
process.on("warning", (warning) => logger_default.warn("System warning: ", warning));
process.on("exit", () => {
  logger_default.info("Service exit");
  logger_default.footer();
});
process.on("SIGTERM", () => {
  logger_default.warn("received kill signal");
  process.exit(2);
});
process.on("SIGINT", () => {
  process.exit(0);
});

// src/lib/server.ts
import Koa from "koa";
import KoaRouter from "koa-router";
import koaRange from "koa-range";
import koaCors from "koa2-cors";
import koaBody from "koa-body";
import _11 from "lodash";

// src/lib/request/Request.ts
import _7 from "lodash";

// src/lib/exceptions/Exception.ts
import assert from "assert";
import _6 from "lodash";
var Exception = class extends Error {
  /** 错误码 */
  errcode;
  /** 错误消息 */
  errmsg;
  /** 数据 */
  data;
  /** HTTP状态码 */
  httpStatusCode;
  constructor(exception, _errmsg) {
    assert(_6.isArray(exception), "Exception must be Array");
    const [errcode, errmsg] = exception;
    assert(_6.isFinite(errcode), "Exception errcode invalid");
    assert(_6.isString(errmsg), "Exception errmsg invalid");
    super(_errmsg || errmsg);
    this.errcode = errcode;
    this.errmsg = _errmsg || errmsg;
  }
  compare(exception) {
    const [errcode] = exception;
    return this.errcode == errcode;
  }
  setHTTPStatusCode(value) {
    this.httpStatusCode = value;
    return this;
  }
  setData(value) {
    this.data = _6.defaultTo(value, null);
    return this;
  }
};

// src/lib/exceptions/APIException.ts
var APIException = class extends Exception {
  constructor(exception, errmsg) {
    super(exception, errmsg);
  }
};

// src/api/consts/exceptions.ts
var exceptions_default = {
  API_TEST: [-9999, "API\u5F02\u5E38\u9519\u8BEF"],
  API_REQUEST_PARAMS_INVALID: [-2e3, "\u8BF7\u6C42\u53C2\u6570\u975E\u6CD5"],
  API_REQUEST_FAILED: [-2001, "\u8BF7\u6C42\u5931\u8D25"],
  API_TOKEN_EXPIRES: [-2002, "Token\u5DF2\u5931\u6548"],
  API_FILE_URL_INVALID: [-2003, "\u8FDC\u7A0B\u6587\u4EF6URL\u975E\u6CD5"],
  API_FILE_EXECEEDS_SIZE: [-2004, "\u8FDC\u7A0B\u6587\u4EF6\u8D85\u51FA\u5927\u5C0F"],
  API_CHAT_STREAM_PUSHING: [-2005, "\u5DF2\u6709\u5BF9\u8BDD\u6D41\u6B63\u5728\u8F93\u51FA"],
  API_CONTENT_FILTERED: [-2006, "\u5185\u5BB9\u7531\u4E8E\u5408\u89C4\u95EE\u9898\u5DF2\u88AB\u963B\u6B62\u751F\u6210"]
};

// src/lib/request/Request.ts
var Request = class {
  /** 请求方法 */
  method;
  /** 请求URL */
  url;
  /** 请求路径 */
  path;
  /** 请求载荷类型 */
  type;
  /** 请求headers */
  headers;
  /** 请求原始查询字符串 */
  search;
  /** 请求查询参数 */
  query;
  /** 请求URL参数 */
  params;
  /** 请求载荷 */
  body;
  /** 上传的文件 */
  files;
  /** 客户端IP地址 */
  remoteIP;
  /** 请求接受时间戳（毫秒） */
  time;
  constructor(ctx, options = {}) {
    const { time } = options;
    this.method = ctx.request.method;
    this.url = ctx.request.url;
    this.path = ctx.request.path;
    this.type = ctx.request.type;
    this.headers = ctx.request.headers || {};
    this.search = ctx.request.search;
    this.query = ctx.query || {};
    this.params = ctx.params || {};
    this.body = ctx.request.body || {};
    this.files = ctx.request.files || {};
    this.remoteIP = this.headers["X-Real-IP"] || this.headers["x-real-ip"] || this.headers["X-Forwarded-For"] || this.headers["x-forwarded-for"] || ctx.ip || null;
    this.time = Number(_7.defaultTo(time, util_default.timestamp()));
  }
  validate(key, fn) {
    try {
      const value = _7.get(this, key);
      if (fn) {
        if (fn(value) === false)
          throw `[Mismatch] -> ${fn}`;
      } else if (_7.isUndefined(value))
        throw "[Undefined]";
    } catch (err) {
      logger_default.warn(`Params ${key} invalid:`, err);
      throw new APIException(exceptions_default.API_REQUEST_PARAMS_INVALID, `Params ${key} invalid`);
    }
    return this;
  }
};

// src/lib/response/Response.ts
import mime2 from "mime";
import _9 from "lodash";

// src/lib/response/Body.ts
import _8 from "lodash";
var Body = class _Body {
  /** 状态码 */
  code;
  /** 状态消息 */
  message;
  /** 载荷 */
  data;
  /** HTTP状态码 */
  statusCode;
  constructor(options = {}) {
    const { code, message, data, statusCode } = options;
    this.code = Number(_8.defaultTo(code, 0));
    this.message = _8.defaultTo(message, "OK");
    this.data = _8.defaultTo(data, null);
    this.statusCode = Number(_8.defaultTo(statusCode, 200));
  }
  toObject() {
    return {
      code: this.code,
      message: this.message,
      data: this.data
    };
  }
  static isInstance(value) {
    return value instanceof _Body;
  }
};

// src/lib/response/Response.ts
var Response = class _Response {
  /** 响应HTTP状态码 */
  statusCode;
  /** 响应内容类型 */
  type;
  /** 响应headers */
  headers;
  /** 重定向目标 */
  redirect;
  /** 响应载荷 */
  body;
  /** 响应载荷大小 */
  size;
  /** 响应时间戳 */
  time;
  constructor(body, options = {}) {
    const { statusCode, type, headers, redirect, size, time } = options;
    this.statusCode = Number(_9.defaultTo(statusCode, Body.isInstance(body) ? body.statusCode : void 0));
    this.type = type;
    this.headers = headers;
    this.redirect = redirect;
    this.size = size;
    this.time = Number(_9.defaultTo(time, util_default.timestamp()));
    this.body = body;
  }
  injectTo(ctx) {
    this.redirect && ctx.redirect(this.redirect);
    this.statusCode && (ctx.status = this.statusCode);
    this.type && (ctx.type = mime2.getType(this.type) || this.type);
    const headers = this.headers || {};
    if (this.size && !headers["Content-Length"] && !headers["content-length"])
      headers["Content-Length"] = this.size;
    ctx.set(headers);
    if (Body.isInstance(this.body))
      ctx.body = this.body.toObject();
    else
      ctx.body = this.body;
  }
  static isInstance(value) {
    return value instanceof _Response;
  }
};

// src/lib/response/FailureBody.ts
import _10 from "lodash";

// src/lib/consts/exceptions.ts
var exceptions_default2 = {
  SYSTEM_ERROR: [-1e3, "\u7CFB\u7EDF\u5F02\u5E38"],
  SYSTEM_REQUEST_VALIDATION_ERROR: [-1001, "\u8BF7\u6C42\u53C2\u6570\u6821\u9A8C\u9519\u8BEF"],
  SYSTEM_NOT_ROUTE_MATCHING: [-1002, "\u65E0\u5339\u914D\u7684\u8DEF\u7531"]
};

// src/lib/response/FailureBody.ts
var FailureBody = class _FailureBody extends Body {
  constructor(error, _data) {
    let errcode, errmsg, data = _data, httpStatusCode = http_status_codes_default.OK;
    ;
    if (_10.isString(error))
      error = new Exception(exceptions_default2.SYSTEM_ERROR, error);
    else if (error instanceof APIException || error instanceof Exception)
      ({ errcode, errmsg, data, httpStatusCode } = error);
    else if (_10.isError(error))
      ({ errcode, errmsg, data, httpStatusCode } = new Exception(exceptions_default2.SYSTEM_ERROR, error.message));
    super({
      code: errcode || -1,
      message: errmsg || "Internal error",
      data,
      statusCode: httpStatusCode
    });
  }
  static isInstance(value) {
    return value instanceof _FailureBody;
  }
};

// src/lib/server.ts
var Server = class {
  app;
  router;
  constructor() {
    this.app = new Koa();
    this.app.use(koaCors());
    this.app.use(koaRange);
    this.router = new KoaRouter({ prefix: config_default.service.urlPrefix });
    this.app.use(async (ctx, next) => {
      if (ctx.request.type === "application/xml" || ctx.request.type === "application/ssml+xml")
        ctx.req.headers["content-type"] = "text/xml";
      try {
        await next();
      } catch (err) {
        logger_default.error(err);
        const failureBody = new FailureBody(err);
        new Response(failureBody).injectTo(ctx);
      }
    });
    this.app.use(koaBody(_11.clone(config_default.system.requestBody)));
    this.app.on("error", (err) => {
      if (["ECONNRESET", "ECONNABORTED", "EPIPE", "ECANCELED"].includes(err.code)) return;
      logger_default.error(err);
    });
    logger_default.success("Server initialized");
  }
  attachRoutes(routes) {
    routes.forEach((route) => {
      const prefix = route.prefix || "";
      for (let method in route) {
        if (method === "prefix") continue;
        if (!_11.isObject(route[method])) {
          logger_default.warn(`Router ${prefix} ${method} invalid`);
          continue;
        }
        for (let uri in route[method]) {
          this.router[method](`${prefix}${uri}`, async (ctx) => {
            const { request, response } = await this.#requestProcessing(ctx, route[method][uri]);
            if (response != null && config_default.system.requestLog)
              logger_default.info(`<- ${request.method} ${request.url} ${response.time - request.time}ms`);
          });
        }
      }
      logger_default.info(`Route ${config_default.service.urlPrefix || ""}${prefix} attached`);
    });
    this.app.use(this.router.routes());
    this.app.use((ctx) => {
      const request = new Request(ctx);
      logger_default.debug(`-> ${ctx.request.method} ${ctx.request.url} request is not supported - ${request.remoteIP || "unknown"}`);
      const message = `[\u8BF7\u6C42\u6709\u8BEF]: \u6B63\u786E\u8BF7\u6C42\u4E3A POST -> /v1/chat/completions\uFF0C\u5F53\u524D\u8BF7\u6C42\u4E3A ${ctx.request.method} -> ${ctx.request.url} \u8BF7\u7EA0\u6B63`;
      logger_default.warn(message);
      const failureBody = new FailureBody(new Error(message));
      const response = new Response(failureBody);
      response.injectTo(ctx);
      if (config_default.system.requestLog)
        logger_default.info(`<- ${request.method} ${request.url} ${response.time - request.time}ms`);
    });
  }
  #requestProcessing(ctx, routeFn) {
    return new Promise((resolve) => {
      const request = new Request(ctx);
      try {
        if (config_default.system.requestLog)
          logger_default.info(`-> ${request.method} ${request.url}`);
        routeFn(request).then((response) => {
          try {
            if (!Response.isInstance(response)) {
              const _response = new Response(response);
              _response.injectTo(ctx);
              return resolve({ request, response: _response });
            }
            response.injectTo(ctx);
            resolve({ request, response });
          } catch (err) {
            logger_default.error(err);
            const failureBody = new FailureBody(err);
            const response2 = new Response(failureBody);
            response2.injectTo(ctx);
            resolve({ request, response: response2 });
          }
        }).catch((err) => {
          try {
            logger_default.error(err);
            const failureBody = new FailureBody(err);
            const response = new Response(failureBody);
            response.injectTo(ctx);
            resolve({ request, response });
          } catch (err2) {
            logger_default.error(err2);
            const failureBody = new FailureBody(err2);
            const response = new Response(failureBody);
            response.injectTo(ctx);
            resolve({ request, response });
          }
        });
      } catch (err) {
        logger_default.error(err);
        const failureBody = new FailureBody(err);
        const response = new Response(failureBody);
        response.injectTo(ctx);
        resolve({ request, response });
      }
    });
  }
  async listen() {
    const host = config_default.service.host;
    const port = config_default.service.port;
    await Promise.all([
      new Promise((resolve, reject) => {
        if (host === "0.0.0.0" || host === "localhost" || host === "127.0.0.1")
          return resolve(null);
        this.app.listen(port, "localhost", (err) => {
          if (err) return reject(err);
          resolve(null);
        });
      }),
      new Promise((resolve, reject) => {
        this.app.listen(port, host, (err) => {
          if (err) return reject(err);
          resolve(null);
        });
      })
    ]);
    logger_default.success(`Server listening on port ${port} (${host})`);
  }
};
var server_default = new Server();

// src/api/routes/index.ts
import fs5 from "fs-extra";

// src/api/routes/chat.ts
import _13 from "lodash";

// src/api/controllers/chat.ts
import { PassThrough } from "stream";
import _12 from "lodash";
import axios2 from "axios";
var BASE_URL = "https://chat.qwen.ai";
var MAX_RETRY_COUNT = 3;
var RETRY_DELAY = 5e3;
var FAKE_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
  Connection: "keep-alive",
  Accept: "application/json",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Content-Type": "application/json",
  "sec-ch-ua": '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
  source: "web",
  Version: "0.1.13",
  "bx-v": "2.5.31",
  Origin: BASE_URL,
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"
};
var MODEL_MAP = {
  "qwen-plus": "qwen3.5-plus",
  "qwen-turbo": "qwen3.5-plus",
  "qwen-max": "qwen3.6-plus",
  "qwen3.5-plus": "qwen3.5-plus",
  "qwen3.5-flash": "qwen3.5-flash",
  "qwen3.6-plus": "qwen3.6-plus",
  "qwen3.6-max-preview": "qwen3.6-max-preview",
  "qwen3.6-27b": "qwen3.6-27b",
  "qwen3.7-plus": "qwen3.7-plus",
  "qwen3.7-max": "qwen3.7-max",
  "qwen3.8-max-preview": "qwen3.8-max-preview",
  "qwen3-max": "qwen3-max",
  "qwen3-vl-plus": "qwen3-vl-plus",
  "qwen3-vl-flash": "qwen3-vl-flash",
  "qwen3-plus": "qwen3.5-plus",
  "qwen-think": "qwen3.5-plus",
  "qwen-search": "qwen3.5-plus",
  "qwen-think-search": "qwen3.5-plus"
};
var THINKING_MODELS = ["qwen-think", "qwen-think-search"];
var SEARCH_MODELS = ["qwen-search", "qwen-think-search"];
function tokenSplit(authorization) {
  return authorization.replace("Bearer ", "").split(",").map((v) => v.trim()).filter((v) => v);
}
async function getTokenLiveStatus(token) {
  try {
    const result = await axios2.get(`${BASE_URL}/api/v1/auths/`, {
      headers: {
        ...FAKE_HEADERS,
        Authorization: `Bearer ${token}`,
        Referer: `${BASE_URL}/`
      },
      timeout: 15e3,
      validateStatus: () => true
    });
    return result.status === 200;
  } catch (err) {
    logger_default.error("Token\u68C0\u67E5\u5931\u8D25:", err.message);
    return false;
  }
}
function messagesPrepare(messages) {
  const validMessages = messages.filter(
    (msg) => ["system", "user", "assistant"].includes(msg.role)
  );
  const extractContent = (content) => {
    if (_12.isString(content)) return content;
    if (_12.isArray(content)) {
      return content.filter((item) => item.type === "text").map((item) => item.text).join("\n");
    }
    return "";
  };
  const mergedMessages = [];
  for (const msg of validMessages) {
    const content = extractContent(msg.content);
    if (!content) continue;
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
      mergedMessages[mergedMessages.length - 1].content += "\n" + content;
    } else {
      mergedMessages.push({ role: msg.role, content });
    }
  }
  if (mergedMessages.length === 1 && mergedMessages[0].role === "user") {
    return mergedMessages[0].content;
  }
  return mergedMessages.map((msg) => {
    switch (msg.role) {
      case "system":
        return `System: ${msg.content}`;
      case "assistant":
        return `Assistant: ${msg.content}`;
      case "user":
        return `User: ${msg.content}`;
      default:
        return msg.content;
    }
  }).join("\n\n");
}
function extractTextContent(content) {
  if (_12.isString(content)) return content;
  if (_12.isArray(content)) {
    return content.filter((item) => item && item.type === "text").map((item) => item.text).join("\n");
  }
  return "";
}
function buildToolSystemPrompt(tools) {
  const toolDefs = tools.map((t) => t && t.type === "function" && t.function ? t.function : t).filter(Boolean);
  const toolsJson = JSON.stringify(toolDefs, null, 2);
  return [
    "# Tool Calling",
    "",
    "You are an agent with access to the tools listed below. When you need to use a tool, you MUST reply with one or more tool-call blocks in EXACTLY this format (Qwen native format):",
    "",
    "<tool_call>",
    '{"name": "<tool_name>", "arguments": {<json-arguments>}}',
    "</tool_call>",
    "",
    "Strict rules:",
    "- When calling tools, output ONLY the <tool_call> block(s). Do NOT add any prose before or after them.",
    `- "arguments" MUST be a valid JSON object that matches the tool's parameter schema.`,
    "- To call several tools at once, emit several <tool_call> blocks back to back.",
    "- Tool results are returned to you inside <tool_response> blocks. Use them to continue.",
    "- When the task is finished and you are giving the final answer to the user, reply in plain text with NO <tool_call> block.",
    "",
    "Available tools (JSON Schema):",
    "<tools>",
    toolsJson,
    "</tools>"
  ].join("\n");
}
function safeParseToolJson(raw) {
  if (!raw) return null;
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fence) s = fence[1].trim();
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function toOpenAIToolCall(parsed) {
  const args = parsed.arguments;
  return {
    id: `call_${util_default.uuid(false).slice(0, 24)}`,
    type: "function",
    function: {
      name: parsed.name,
      arguments: _12.isString(args) ? args : JSON.stringify(args ?? {})
    }
  };
}
function parseToolCalls(text) {
  const toolCalls = [];
  const regex = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const parsed = safeParseToolJson(match[1]);
    if (parsed && parsed.name) toolCalls.push(toOpenAIToolCall(parsed));
  }
  let content = text.replace(regex, "").trim();
  if (!toolCalls.length) {
    const bare = safeParseToolJson(text);
    if (bare && bare.name && bare.arguments !== void 0) {
      toolCalls.push(toOpenAIToolCall(bare));
      content = "";
    }
  }
  return { content, toolCalls };
}
function messagesPrepareWithTools(messages, tools) {
  const parts = [buildToolSystemPrompt(tools)];
  for (const msg of messages) {
    switch (msg.role) {
      case "system": {
        const c = extractTextContent(msg.content);
        if (c) parts.push(`System: ${c}`);
        break;
      }
      case "user": {
        const c = extractTextContent(msg.content);
        if (c) parts.push(`User: ${c}`);
        break;
      }
      case "assistant": {
        let c = extractTextContent(msg.content);
        if (_12.isArray(msg.tool_calls) && msg.tool_calls.length) {
          const calls = msg.tool_calls.map((tc) => {
            const name = tc.function?.name;
            let args = tc.function?.arguments;
            try {
              args = JSON.parse(args);
            } catch {
            }
            return `<tool_call>
${JSON.stringify({
              name,
              arguments: args ?? {}
            })}
</tool_call>`;
          }).join("\n");
          c = c ? `${c}
${calls}` : calls;
        }
        if (c) parts.push(`Assistant: ${c}`);
        break;
      }
      case "tool": {
        const c = extractTextContent(msg.content);
        const name = msg.name || msg.tool_call_id || "";
        parts.push(
          `Tool result${name ? ` for ${name}` : ""}:
<tool_response>
${c}
</tool_response>`
        );
        break;
      }
    }
  }
  parts.push("Assistant:");
  return parts.join("\n\n");
}
function buildStreamFromCompletion(completion) {
  const transStream = new PassThrough();
  const choice = completion.choices[0];
  const base = {
    id: completion.id,
    model: completion.model,
    object: "chat.completion.chunk",
    created: completion.created
  };
  const send = (delta, finishReason = null) => transStream.write(
    `data: ${JSON.stringify({
      ...base,
      choices: [{ index: 0, delta, finish_reason: finishReason }]
    })}

`
  );
  send({ role: "assistant", content: "" });
  if (choice.message.tool_calls?.length) {
    send({
      tool_calls: choice.message.tool_calls.map((tc, i) => ({
        index: i,
        id: tc.id,
        type: "function",
        function: { name: tc.function.name, arguments: tc.function.arguments }
      }))
    });
  } else if (choice.message.content) {
    send({ content: choice.message.content });
  }
  send({}, choice.finish_reason || "stop");
  transStream.write("data: [DONE]\n\n");
  transStream.end();
  return transStream;
}
function resolveModel(model) {
  return MODEL_MAP[model] || "qwen3.5-plus";
}
function isGuestMode(token) {
  return !token || token === "guest" || token === "none";
}
async function createConversation(model, token, chatType = "t2t") {
  const qwenModel = resolveModel(model);
  const isGuest = isGuestMode(token);
  const headers = {
    ...FAKE_HEADERS,
    Timezone: (/* @__PURE__ */ new Date()).toString(),
    "x-request-id": util_default.uuid(),
    Referer: isGuest ? `${BASE_URL}/c/guest` : `${BASE_URL}/`
  };
  if (!isGuest) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const body = {
    title: "New Chat",
    models: [qwenModel],
    chat_mode: isGuest ? "guest" : "normal",
    chat_type: chatType,
    timestamp: Date.now(),
    project_id: ""
  };
  const result = await axios2.post(`${BASE_URL}/api/v2/chats/new`, body, {
    headers,
    timeout: 15e3,
    validateStatus: () => true
  });
  const chatId = result.data?.data?.id || result.data?.id;
  if (!chatId) {
    logger_default.error("\u521B\u5EFA\u5BF9\u8BDD\u5931\u8D25:", JSON.stringify(result.data));
    throw new APIException(
      exceptions_default.API_REQUEST_FAILED,
      `\u521B\u5EFA\u5BF9\u8BDD\u5931\u8D25: ${JSON.stringify(result.data)}`
    );
  }
  logger_default.info(`\u5BF9\u8BDD\u5DF2\u521B\u5EFA: ${chatId}`);
  return chatId;
}
async function removeConversation(chatId, token) {
  const isGuest = isGuestMode(token);
  if (isGuest) return;
  try {
    await axios2.delete(`${BASE_URL}/api/v2/chats/${chatId}`, {
      headers: {
        ...FAKE_HEADERS,
        Authorization: `Bearer ${token}`,
        Referer: `${BASE_URL}/`
      },
      timeout: 15e3,
      validateStatus: () => true
    });
    logger_default.info(`\u5BF9\u8BDD\u5DF2\u5220\u9664: ${chatId}`);
  } catch (err) {
    logger_default.warn(`\u5220\u9664\u5BF9\u8BDD\u5931\u8D25: ${err.message}`);
  }
}
function buildCompletionBody(model, chatId, content, token) {
  const qwenModel = resolveModel(model);
  const isGuest = isGuestMode(token);
  const enableThinking = THINKING_MODELS.includes(model);
  const enableSearch = SEARCH_MODELS.includes(model);
  const chatType = enableSearch ? "search" : "t2t";
  return {
    stream: true,
    incremental_output: true,
    chat_type: chatType,
    model: qwenModel,
    messages: [
      {
        role: "user",
        content,
        chat_type: chatType,
        extra: {},
        feature_config: {
          thinking_enabled: enableThinking,
          output_schema: "phase"
        }
      }
    ],
    session_id: util_default.uuid(),
    id: util_default.uuid(),
    sub_chat_type: chatType,
    chat_mode: isGuest ? "guest" : "normal",
    chat_id: chatId
  };
}
async function sendCompletionRequest(model, chatId, content, token) {
  const isGuest = isGuestMode(token);
  const headers = {
    ...FAKE_HEADERS,
    Timezone: (/* @__PURE__ */ new Date()).toString(),
    "x-request-id": util_default.uuid(),
    "x-accel-buffering": "no",
    Referer: isGuest ? `${BASE_URL}/c/guest` : `${BASE_URL}/c/${chatId}`
  };
  if (!isGuest) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const body = buildCompletionBody(model, chatId, content, token);
  return await axios2.post(
    `${BASE_URL}/api/v2/chat/completions?chat_id=${chatId}`,
    body,
    {
      headers,
      timeout: 12e4,
      responseType: "stream",
      validateStatus: () => true
    }
  );
}
async function receiveStream(model, stream) {
  return new Promise((resolve, reject) => {
    let content = "";
    let thinkingContent = "";
    let responseId = "";
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === "[DONE]") continue;
        try {
          const data = JSON.parse(dataStr);
          if (data["response.created"]) {
            responseId = data["response.created"].response_id || responseId;
            continue;
          }
          const choices = data.choices;
          if (!choices || !choices[0]) continue;
          const delta = choices[0].delta;
          if (!delta) continue;
          const phase = delta.phase;
          const status = delta.status;
          if (phase === "thinking_summary" && status === "typing") {
            if (delta.extra?.summary_thought?.content) {
              thinkingContent += delta.extra.summary_thought.content.join("");
            }
          } else if (phase === "answer" && status === "typing") {
            if (delta.content) {
              content += delta.content;
            }
          }
        } catch (err) {
        }
      }
    });
    stream.on("end", () => {
      resolve({ content, thinkingContent, responseId });
    });
    stream.on("error", (err) => {
      reject(err);
    });
  });
}
async function createCompletion(model, messages, token, refConvId, retryCount = 0, tools, toolChoice) {
  const useTools = _12.isArray(tools) && tools.length > 0 && toolChoice !== "none";
  return (async () => {
    const content = useTools ? messagesPrepareWithTools(messages, tools) : messagesPrepare(messages);
    const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
    const chatId = refConvId || await createConversation(model, token, chatType);
    const result = await sendCompletionRequest(model, chatId, content, token);
    if (result.headers["content-type"]?.includes("application/json")) {
      const errorData = await new Promise((resolve) => {
        let data = "";
        result.data.on("data", (chunk) => data += chunk.toString());
        result.data.on("end", () => resolve(data));
      });
      throw new APIException(exceptions_default.API_REQUEST_FAILED, `\u8BF7\u6C42\u5931\u8D25: ${errorData}`);
    }
    const {
      content: responseContent,
      thinkingContent,
      responseId
    } = await receiveStream(model, result.data);
    if (!refConvId) {
      removeConversation(chatId, token).catch(() => {
      });
    }
    if (useTools) {
      const { content: cleaned, toolCalls } = parseToolCalls(responseContent);
      if (toolCalls.length) {
        return {
          id: responseId || chatId,
          model,
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: cleaned || null,
                tool_calls: toolCalls
              },
              finish_reason: "tool_calls"
            }
          ],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          created: util_default.unixTimestamp()
        };
      }
      return {
        id: responseId || chatId,
        model,
        object: "chat.completion",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: cleaned,
              ...thinkingContent ? { reasoning_content: thinkingContent } : {}
            },
            finish_reason: "stop"
          }
        ],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        created: util_default.unixTimestamp()
      };
    }
    return {
      id: responseId || chatId,
      model,
      object: "chat.completion",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseContent,
            ...thinkingContent ? { reasoning_content: thinkingContent } : {}
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: 1,
        completion_tokens: 1,
        total_tokens: 2
      },
      created: util_default.unixTimestamp()
    };
  })().catch((err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      logger_default.error(
        `Stream error (will retry ${retryCount + 1}/${MAX_RETRY_COUNT}):`,
        err.message
      );
      return (async () => {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return createCompletion(
          model,
          messages,
          token,
          null,
          retryCount + 1,
          tools,
          toolChoice
        );
      })();
    }
    throw err;
  });
}
function createTransStream(model, stream, chatId, endCallback) {
  const transStream = new PassThrough();
  let responseId = chatId;
  const writeChunk = (content, reasoningContent, finishReason) => {
    const chunk = {
      id: responseId,
      model,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: {
            role: "assistant",
            content: content || "",
            ...reasoningContent !== void 0 ? { reasoning_content: reasoningContent } : {}
          },
          finish_reason: finishReason || null
        }
      ],
      created: util_default.unixTimestamp()
    };
    transStream.write(`data: ${JSON.stringify(chunk)}

`);
  };
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") continue;
      try {
        const data = JSON.parse(dataStr);
        if (data["response.created"]) {
          responseId = data["response.created"].response_id || responseId;
          continue;
        }
        const choices = data.choices;
        if (!choices || !choices[0]) continue;
        const delta = choices[0].delta;
        if (!delta) continue;
        const phase = delta.phase;
        const status = delta.status;
        if (phase === "thinking_summary") {
          if (status === "typing") {
            if (delta.extra?.summary_thought?.content) {
              const thinkText = delta.extra.summary_thought.content.join("");
              if (thinkText) {
                writeChunk("", thinkText);
              }
            }
          }
        } else if (phase === "answer") {
          if (status === "typing") {
            if (delta.content) {
              writeChunk(delta.content);
            }
          } else if (status === "finished") {
            writeChunk("", void 0, "stop");
            transStream.write("data: [DONE]\n\n");
            transStream.end();
            endCallback && endCallback();
          }
        }
      } catch (err) {
      }
    }
  });
  stream.on("error", (err) => {
    logger_default.error("Stream error:", err.message);
    writeChunk(`
[Stream Error] ${err.message}`, void 0, "stop");
    transStream.write("data: [DONE]\n\n");
    transStream.end();
    endCallback && endCallback();
  });
  stream.on("end", () => {
    if (!transStream.writableEnded) {
      writeChunk("", void 0, "stop");
      transStream.write("data: [DONE]\n\n");
      transStream.end();
      endCallback && endCallback();
    }
  });
  return transStream;
}
async function createCompletionStream(model, messages, token, refConvId, retryCount = 0, tools, toolChoice) {
  const useTools = _12.isArray(tools) && tools.length > 0 && toolChoice !== "none";
  if (useTools) {
    const completion = await createCompletion(
      model,
      messages,
      token,
      refConvId,
      0,
      tools,
      toolChoice
    );
    return buildStreamFromCompletion(completion);
  }
  return (async () => {
    const content = messagesPrepare(messages);
    const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
    const chatId = refConvId || await createConversation(model, token, chatType);
    const result = await sendCompletionRequest(model, chatId, content, token);
    if (result.headers["content-type"]?.includes("application/json")) {
      const errorData = await new Promise((resolve) => {
        let data = "";
        result.data.on("data", (chunk) => data += chunk.toString());
        result.data.on("end", () => resolve(data));
      });
      throw new APIException(exceptions_default.API_REQUEST_FAILED, `\u8BF7\u6C42\u5931\u8D25: ${errorData}`);
    }
    const transStream = createTransStream(model, result.data, chatId, () => {
      if (!refConvId) {
        removeConversation(chatId, token).catch(() => {
        });
      }
    });
    return transStream;
  })().catch((err) => {
    if (retryCount < MAX_RETRY_COUNT) {
      logger_default.error(
        `Stream error (will retry ${retryCount + 1}/${MAX_RETRY_COUNT}):`,
        err.message
      );
      return (async () => {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return createCompletionStream(
          model,
          messages,
          token,
          null,
          retryCount + 1
        );
      })();
    }
    throw err;
  });
}
function extractResponsesText(content) {
  if (_12.isString(content)) return content;
  if (_12.isArray(content)) {
    return content.filter(
      (p) => p && (p.type === "input_text" || p.type === "output_text" || p.type === "text") && p.text
    ).map((p) => p.text).join("\n");
  }
  return "";
}
function prepareResponsesPrompt(instructions, input, tools) {
  const parts = [];
  if (_12.isArray(tools) && tools.length) parts.push(buildToolSystemPrompt(tools));
  if (instructions && _12.isString(instructions))
    parts.push(`System: ${instructions}`);
  const items = _12.isString(input) ? [{ type: "message", role: "user", content: input }] : _12.isArray(input) ? input : [];
  const cap = (r) => r === "system" ? "System" : r === "assistant" ? "Assistant" : r === "tool" ? "Tool" : "User";
  for (const item of items) {
    if (!item) continue;
    const type = item.type || "message";
    if (type === "message") {
      const text = extractResponsesText(item.content);
      if (text) parts.push(`${cap(item.role || "user")}: ${text}`);
    } else if (type === "function_call") {
      let args = item.arguments;
      try {
        args = JSON.parse(args);
      } catch {
      }
      parts.push(
        `Assistant: <tool_call>
${JSON.stringify({
          name: item.name,
          arguments: args ?? {}
        })}
</tool_call>`
      );
    } else if (type === "function_call_output") {
      const out = _12.isString(item.output) ? item.output : JSON.stringify(item.output);
      parts.push(`Tool result:
<tool_response>
${out}
</tool_response>`);
    }
  }
  parts.push("Assistant:");
  return parts.join("\n\n");
}
async function fetchQwenAnswer(model, content, token, refConvId) {
  const chatType = SEARCH_MODELS.includes(model) ? "search" : "t2t";
  const chatId = refConvId || await createConversation(model, token, chatType);
  const result = await sendCompletionRequest(model, chatId, content, token);
  if (result.headers["content-type"]?.includes("application/json")) {
    const errorData = await new Promise((resolve) => {
      let data = "";
      result.data.on("data", (chunk) => data += chunk.toString());
      result.data.on("end", () => resolve(data));
    });
    throw new APIException(exceptions_default.API_REQUEST_FAILED, `\u8BF7\u6C42\u5931\u8D25: ${errorData}`);
  }
  const { content: responseContent, responseId } = await receiveStream(
    model,
    result.data
  );
  if (!refConvId) removeConversation(chatId, token).catch(() => {
  });
  return { responseContent, responseId: responseId || chatId };
}
function buildResponsesOutput(textContent, toolCalls) {
  const output = [];
  if (textContent) {
    output.push({
      type: "message",
      id: `msg_${util_default.uuid(false).slice(0, 24)}`,
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text: textContent, annotations: [] }]
    });
  }
  for (const tc of toolCalls) {
    output.push({
      type: "function_call",
      id: `fc_${util_default.uuid(false).slice(0, 24)}`,
      call_id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
      status: "completed"
    });
  }
  return output;
}
async function createResponses(model, body, token) {
  const { instructions, input, tools, tool_choice } = body;
  const content = prepareResponsesPrompt(instructions, input, tools);
  const { responseContent } = await fetchQwenAnswer(
    model,
    content,
    token,
    body.previous_response_id
  );
  const useTools = _12.isArray(tools) && tools.length > 0 && tool_choice !== "none";
  let textContent = responseContent;
  let toolCalls = [];
  if (useTools) {
    const parsed = parseToolCalls(responseContent);
    textContent = parsed.content;
    toolCalls = parsed.toolCalls;
  }
  const output = buildResponsesOutput(textContent, toolCalls);
  return {
    id: `resp_${util_default.uuid(false).slice(0, 24)}`,
    object: "response",
    created_at: util_default.unixTimestamp(),
    status: "completed",
    model,
    output,
    usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
  };
}
async function createResponsesStream(model, body, token) {
  const { instructions, input, tools, tool_choice } = body;
  const content = prepareResponsesPrompt(instructions, input, tools);
  const { responseContent } = await fetchQwenAnswer(
    model,
    content,
    token,
    body.previous_response_id
  );
  const useTools = _12.isArray(tools) && tools.length > 0 && tool_choice !== "none";
  let textContent = responseContent;
  let toolCalls = [];
  if (useTools) {
    const parsed = parseToolCalls(responseContent);
    textContent = parsed.content;
    toolCalls = parsed.toolCalls;
  }
  const output = buildResponsesOutput(textContent, toolCalls);
  const respId = `resp_${util_default.uuid(false).slice(0, 24)}`;
  const ts = new PassThrough();
  let seq = 0;
  const emit = (type, obj) => ts.write(
    `event: ${type}
data: ${JSON.stringify({
      type,
      sequence_number: seq++,
      ...obj
    })}

`
  );
  const resp = (status, out) => ({
    id: respId,
    object: "response",
    created_at: util_default.unixTimestamp(),
    status,
    model,
    output: out,
    usage: status === "completed" ? { input_tokens: 1, output_tokens: 1, total_tokens: 2 } : null
  });
  emit("response.created", { response: resp("in_progress", []) });
  emit("response.in_progress", { response: resp("in_progress", []) });
  let idx = 0;
  for (const item of output) {
    if (item.type === "message") {
      const text = item.content[0].text;
      emit("response.output_item.added", {
        output_index: idx,
        item: { ...item, status: "in_progress", content: [] }
      });
      emit("response.content_part.added", {
        item_id: item.id,
        output_index: idx,
        content_index: 0,
        part: { type: "output_text", text: "", annotations: [] }
      });
      emit("response.output_text.delta", {
        item_id: item.id,
        output_index: idx,
        content_index: 0,
        delta: text
      });
      emit("response.output_text.done", {
        item_id: item.id,
        output_index: idx,
        content_index: 0,
        text
      });
      emit("response.content_part.done", {
        item_id: item.id,
        output_index: idx,
        content_index: 0,
        part: item.content[0]
      });
      emit("response.output_item.done", { output_index: idx, item });
    } else if (item.type === "function_call") {
      emit("response.output_item.added", {
        output_index: idx,
        item: { ...item, status: "in_progress", arguments: "" }
      });
      emit("response.function_call_arguments.delta", {
        item_id: item.id,
        output_index: idx,
        delta: item.arguments
      });
      emit("response.function_call_arguments.done", {
        item_id: item.id,
        output_index: idx,
        arguments: item.arguments
      });
      emit("response.output_item.done", { output_index: idx, item });
    }
    idx++;
  }
  emit("response.completed", { response: resp("completed", output) });
  ts.write("data: [DONE]\n\n");
  ts.end();
  return ts;
}
var chat_default = {
  createCompletion,
  createCompletionStream,
  createResponses,
  createResponsesStream,
  tokenSplit,
  getTokenLiveStatus
};

// src/api/routes/chat.ts
import process2 from "process";
var QWEN_AUTHORIZATION = process2.env.QWEN_AUTHORIZATION;
var chat_default2 = {
  prefix: "/v1/chat",
  post: {
    "/completions": async (request) => {
      request.validate("body.conversation_id", (v) => _13.isUndefined(v) || _13.isString(v)).validate("body.messages", _13.isArray).validate("headers.authorization", _13.isString);
      if (QWEN_AUTHORIZATION) {
        request.headers.authorization = "Bearer " + QWEN_AUTHORIZATION;
      }
      const tokens = chat_default.tokenSplit(request.headers.authorization);
      const token = _13.sample(tokens);
      let { model, conversation_id: convId, messages, stream, tools, tool_choice } = request.body;
      model = model.toLowerCase();
      if (stream) {
        const stream2 = await chat_default.createCompletionStream(model, messages, token, convId, 0, tools, tool_choice);
        return new Response(stream2, {
          type: "text/event-stream"
        });
      } else
        return await chat_default.createCompletion(model, messages, token, convId, 0, tools, tool_choice);
    }
  }
};

// src/api/routes/responses.ts
import _14 from "lodash";
import process3 from "process";
var QWEN_AUTHORIZATION2 = process3.env.QWEN_AUTHORIZATION;
var responses_default = {
  prefix: "/v1",
  post: {
    "/responses": async (request) => {
      request.validate("headers.authorization", _14.isString);
      if (QWEN_AUTHORIZATION2) {
        request.headers.authorization = "Bearer " + QWEN_AUTHORIZATION2;
      }
      const tokens = chat_default.tokenSplit(request.headers.authorization);
      const token = _14.sample(tokens);
      let { model, stream } = request.body;
      model = (model || "qwen3.7-max").toLowerCase();
      if (stream) {
        const responseStream = await chat_default.createResponsesStream(model, request.body, token);
        return new Response(responseStream, {
          type: "text/event-stream"
        });
      } else
        return await chat_default.createResponses(model, request.body, token);
    }
  }
};

// src/api/routes/ping.ts
var ping_default = {
  prefix: "/ping",
  get: {
    "": async () => "pong"
  }
};

// src/api/routes/token.ts
import _15 from "lodash";
var token_default = {
  prefix: "/token",
  post: {
    "/check": async (request) => {
      request.validate("body.token", _15.isString);
      const live = await chat_default.getTokenLiveStatus(request.body.token);
      return {
        live
      };
    }
  }
};

// src/api/routes/models.ts
var models_default = {
  prefix: "/v1",
  get: {
    "/models": async () => {
      return {
        "data": [
          {
            "id": "qwen-plus",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen-turbo",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen-max",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen-think",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen-search",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen-think-search",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.5-plus",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.5-flash",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.6-plus",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.6-max-preview",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.6-27b",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.7-plus",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.7-max",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3.8-max-preview",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3-max",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3-vl-plus",
            "object": "model",
            "owned_by": "qwen-free-api"
          },
          {
            "id": "qwen3-vl-flash",
            "object": "model",
            "owned_by": "qwen-free-api"
          }
        ]
      };
    }
  }
};

// src/api/routes/index.ts
var routes_default = [
  {
    get: {
      "/": async () => {
        const content = await fs5.readFile("public/welcome.html");
        return new Response(content, {
          type: "html",
          headers: {
            Expires: "-1"
          }
        });
      }
    }
  },
  chat_default2,
  responses_default,
  ping_default,
  token_default,
  models_default
];

// src/vercel.ts
server_default.attachRoutes(routes_default);
var vercel_default = server_default.app.callback();
export {
  vercel_default as default
};
//# sourceMappingURL=vercel.js.map