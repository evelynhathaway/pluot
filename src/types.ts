import {CalendarData} from "ical-generator";

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

export interface GetType {
	(endpoint: string): Promise<object>,
	memo: {
		eventIds: {
			[key: string]: EventIdsType,
		},
		event: {
			[key: string]: EventType,
		},
	},
	eventIds: {
		(userId: number, filter: string): Promise<EventIdsType>,
	},
	event: {
		(userId: number, eventId: number): Promise<EventType>,
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
