import {CalendarData} from "ical-generator";

export interface CalendarType extends CalendarData {
	tag?: string,
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
