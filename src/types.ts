import icalGen from "ical-generator";
import oauth2 from "simple-oauth2";
import sanitizeHtml from "sanitize-html";
import essentials from "ts-essentials";


// Helpers
export type Partial<T> = {
	[P in keyof T]?: T[P];
};
export type DeepPartial<T> = essentials.DeepPartial<T>;
export interface HasToStringType {
	toString: {
		(): string,
	},
};
export type StringIshType = string | HasToStringType;

// Calendar
export interface CalendarType extends icalGen.CalendarData {
	description?: string,
	options: OptionsType,
};
export type ICalResponseType = icalGen.ICalCalendar;

// Filter
export interface FilterType {
	// Helper filters
	tag: string | Array<string>,
	id: string | number | Array<string | number>,
	registrable: boolean,
	upcoming: boolean,
	after: Date | string,
	before: Date | string,
	// Manual connections to the filter param
	manual: string,
};

// Max
export interface SingleMaxType {
	amount?: number | false,
	days?: number | false,
};
export interface MaxType {
	amount?: number | false,
	past?: SingleMaxType,
	upcoming?: SingleMaxType,
};

// Options
export interface OptionsType {
	filter: Partial<FilterType>,
	description: {
		appendLink: boolean,
	},
	events: {
		description: {
			appendLink: boolean,
			plaintext: boolean,
			sanitize: SanitizeOptionsType,
		},
		// Generates filters and top
		max: MaxType,
	},
	maxSize: number,
	save: {
		path: string,
	} | false,
};

// Get function
export type ParamsType = {
	[key: string]: string | HasToStringType;
};
export interface QueueItem {
	fullUrl: string,
	memoize: boolean,
	resolve: Function,
	reject: Function,
};
export interface GetType<T = object> {
	(endpoint: string, params?: ParamsType, memoize?: boolean): Promise<T>,
	memo: {
		[key: string]: T,
	},
	queue: Array<QueueItem>,
	queueRunnerInt: NodeJS.Timeout,
	accessToken: oauth2.AccessToken,
	accountId: number,
	eventIds: {
		(calendar: CalendarType, memoize?: boolean): Promise<EventIdsType>,
	},
	event: {
		(eventId: number, memoize?: boolean): Promise<EventType>,
	},
};

// API responses
export type EventIdsType = Array<number>;
export interface EventType {
	Id: number,
	Url: string,
	Location: string,
	StartDate: string,
	StartTimeSpecified: boolean,
	EndDate: string,
	EndTimeSpecified: boolean,
	RegistrationEnabled: boolean,
	Details: {
		DescriptionHtml: string,
		TimeZone: {
			ZoneId: string,
			Name: string,
			UtcOffset: number
		},
		Organizer: string | null,
	},
	EventType: string,
	Name: string,
};

// Oauth type aliases
export type ClientType = oauth2.ModuleOptions["client"];
export type UserType = oauth2.PasswordTokenConfig;

// HTML cleaning/sanatizing
export type SanitizeOptionsType = sanitizeHtml.IOptions;
