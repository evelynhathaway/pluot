import {CalendarType, OptionsType} from "./types";

export const defaultCalendar: CalendarType = {
	method: "PUBLISH",
}
export const defaultOptions: OptionsType = {
	appendLinkToCalendarDescription: true,
	appendLinkToEventDescription: true,
	maxFileSize: 1000000,
	maxPastEvents: false,
	maxPastEventsDayDelta: 31,
	maxUpcomingEvents: false,
	maxUpcomingEventsDayDelta: 365,
	truncateEventDescription: false,
}
