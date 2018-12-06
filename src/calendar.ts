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
	get: GetType
): Promise<icalGen.ICalCalendar> {
	const cal = icalGen({
		"name": calendar.name,
		"method": "PUBLISH"
	});

	const filter: string = generateFilter({tag: calendar.tag});
	const eventIds: EventIdsType = await get.eventIds(filter);

	log(`Fetching ${eventIds.length} events for ${calendar.name}`);
	for (let eventId of eventIds) {
		const event: EventType = await get.event(eventId);

		log(`Adding event "${event["Name"]}" to "${calendar.name}".`);
		cal.createEvent({
			uid: event.Id, // TODO add domain to calendar, match docs to typings
			start: new Date(event.StartDate),
			end: new Date(event.EndDate),
			summary: event.Name || "Untitled Event",
			organizer: event.Details.Organizer || undefined,
			allDay: event.StartTimeSpecified && event.EndTimeSpecified,
			description: event.Details.DescriptionHtml, // TODO, unescape?, sanatize (with options?), remove new lines between tags?,
			location: event.Location,
		});
	}

	return cal;
};
