import sanitizeHtml from "sanitize-html";
import {SanitizeOptionsType} from "./types";


export const sanitize = function (html: string, options: SanitizeOptionsType = {}): string {
	return sanitizeHtml(html, options);
};
