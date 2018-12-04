import icalGen from "ical-generator";
import {log} from "./log";
import generateFilter from "./filter";
import {CalendarType, OptionsType, GetType, EventType, EventIdsType} from "./types";


export default async function (
	calendar: CalendarType,
	options: OptionsType = {
		appendLinkToCalendarDescription: true,
		appendLinkToEventDescription: true,
		maxFileSize: 1000000,
		maxPastEvents: false,
		maxPastEventsDayDelta: 31,
		maxUpcomingEvents: false,
		maxUpcomingEventsDayDelta: 365,
		truncateEventDescription: false,
	},
	userId: number,
	get: GetType
): Promise<icalGen.ICalCalendar> {
	const cal = icalGen({
		"name": calendar.name,
		"method": "PUBLISH"
	});

	const filter: string = generateFilter({tag: calendar.tag});
	const eventIds: EventIdsType = await get.eventIds(userId, filter);

	log(`Fetching ${eventIds.length} events.`);
	for (let eventId of eventIds) {
		const event: EventType = await get.event(userId, eventId);

		log(`Adding event "${event["Name"]}" to "${calendar.name}".`);
		cal.createEvent({
			start: new Date(event["StartDate"]),
			end: new Date(event["EndDate"]),
			summary: event["Name"] || "Event",
			// organizer: "TODO",
			allDay: event["StartTimeSpecified"] && event["EndTimeSpecified"],
		});
	}

	return cal;
};
