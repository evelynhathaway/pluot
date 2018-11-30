import * as icalGen from "ical-generator";

// TODO add comments, make a better type def file

declare module "pluot" {
	// TODO add more filter fields: https://gethelp.wildapricot.com/en/articles/1612-events-member-api-call
	export interface Calendar extends icalGen.CalendarData {
		tag?: string,
		options?: Options,
	}
	export interface Options {
		appendLinkToCalendarDescription?: boolean,
		appendLinkToEventDescription?: boolean,
		maxFileSize?: number,
		maxPastEvents?: number | false,
		maxPastEventsDayDelta?: number | false,
		maxUpcomingEvents?: number | false,
		maxUpcomingEventsDayDelta?: number | false,
		truncateEventDescription?: boolean,
	}
}
