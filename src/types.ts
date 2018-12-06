import {CalendarData} from "ical-generator";
import {AccessToken} from "simple-oauth2";

export interface CalendarType extends CalendarData {
	tag?: string | Array<string>,
	options?: OptionsType,
}

export interface OptionsType {
	appendLinkToCalendarDescription?: boolean,
	appendLinkToEventDescription?: boolean,
	maxFileSize?: number,
	maxPastEvents?: number | false,
	maxPastEventsDayDelta?: number | false,
	maxUpcomingEvents?: number | false,
	maxUpcomingEventsDayDelta?: number | false,
	truncateEventDescription?: boolean,
}

export type EventIdsType = Array<number>

export interface GetType<T = object> {
	(endpoint: string, memoize?: boolean): Promise<T>,
	memo: {
		[key: string]: T,
	},
	accessToken: AccessToken,
	accountId: number,
	eventIds: {
		(filter: string, memoize?: boolean): Promise<EventIdsType>,
	},
	event: {
		(eventId: number, memoize?: boolean): Promise<EventType>,
	},
}

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
}
