import {CalendarType, OptionsType, SanitizeOptionsType} from "./types";


// Sanitization options
export const defaultSanitizeOptions: SanitizeOptionsType = {
	allowedTags: ["a", "p", "hr", "ol", "ul", "li", "font", "img", "br", "strong", "em", "b", "i", "u", "sub", "sup"],
	allowedAttributes: {
		"*": ["align", "title", "alt", "center", "border", "color"],
		"a": ["href"],
		"hr": ["noshade", "size", "width"],
		"ol": ["type", "start"],
		"ul": ["type"],
		"li": ["type", "value"],
		"img": ["src", "height", "width"],
		"font": ["face", "size"],
	},
	transformTags: {
		"blockquote": "em",
		"img": (tagName, attribs) => {
			// TODO: remove empty `alt` and `title`
			// Transform styled img-based dividers to horizontal rules
			if (attribs.class && attribs.class.match("WaContentDivider")) {
				return {tagName: "hr", attribs: {}};
			} else {
				return {tagName, attribs};
			}
		}
	},
	allowedSchemes: ["http", "https", "mailto"],
	nonTextTags: ["style", "script", "textarea", "noscript", "table", "td", "tr", "th", "tbody"],
};
// Sanitization options for transforming to plaintext
export const plaintextSanitizeOptions: SanitizeOptionsType = {
	allowedTags: [],
	nonTextTags: defaultSanitizeOptions.nonTextTags,
};

// Default options
export const defaultOptions: OptionsType = {
	filter: {},
	description: {
		appendLink: true,
	},
	events: {
		description: {
			appendLink: true,
			plaintext: false,
			sanitize: defaultSanitizeOptions,
		},
		max: {
			amount: false,
			past: {
				amount: false,
				days: 31,
			},
			upcoming: {
				amount: false,
				days: 365,
			},
		},
	},
	maxSize: 1000000,
	save: false,
};

// Default calendar
export const defaultCalendar: CalendarType = {
	method: "PUBLISH",
	options: defaultOptions,
};
