import {EventEmitter} from "events";


export const emitter = new EventEmitter();
export const log = function (message?: string, error?: Error) {
	if (message) {
		emitter.emit("message", message);
	}
	if (error) {
		emitter.emit("error", error);
	}
};
