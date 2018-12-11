import {EventEmitter} from "events";


export const emitter = new EventEmitter();

const log = function (message: string) {
	emitter.emit("message", message);
};
log.verbose = function (message: string) {
	emitter.emit("verbose", message);
};
log.info = log;
log.warn = function (message: string) {
	emitter.emit("warn", message);
};
log.error = function (message: string, error?: Error) {
	emitter.emit("error", message, error);
};

export {log};
