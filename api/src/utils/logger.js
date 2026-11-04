const SERVICE_NAME = "hustlehub-api";

const writeLog = (level, event, details = {}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        service: SERVICE_NAME,
        event,
        ...details
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
        case "error":
            console.error(output);
            break;

        case "warn":
            console.warn(output);
            break;

        default:
            console.log(output);
    }
};

const logger = {
    info(event, details = {}) {
        writeLog("info", event, details);
    },

    warn(event, details = {}) {
        writeLog("warn", event, details);
    },

    error(event, details = {}) {
        writeLog("error", event, details);
    }
};

module.exports = logger;