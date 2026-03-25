const LOG_LEVELS = { info: "INFO", warn: "WARN", error: "ERROR" };

function format(level, message, ...args) {
  const ts = new Date().toISOString();
  const extra = args.length ? " " + args.join(" ") : "";
  return `[${ts}] [${level}] ${message}${extra}`;
}

const logger = {
  info: (msg, ...args) => console.log(format(LOG_LEVELS.info, msg, ...args)),
  warn: (msg, ...args) => console.warn(format(LOG_LEVELS.warn, msg, ...args)),
  error: (msg, ...args) =>
    console.error(format(LOG_LEVELS.error, msg, ...args)),
};

module.exports = { logger };
