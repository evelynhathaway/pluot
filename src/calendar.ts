import icalGen from "ical-generator";
import {log} from "./log";
import generateFilter from "./filter";
import {CalendarType, GetType, EventType, EventIdsType} from "./types";


export default async function (
	calendar: CalendarType,
	get: GetType
): Promise<icalGen.ICalCalendar> {
	const ical = icalGen(calendar);

	const filter: string = generateFilter(calendar);
	const eventIds: EventIdsType = await get.eventIds(filter);

	log(`Fetching ${eventIds.length} events for ${calendar.name}`);
	for (let eventId of eventIds) {
		const event: EventType = await get.event(eventId);

		log(`Adding event "${event["Name"]}" to "${calendar.name}".`);
		ical.createEvent({
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

	return ical;
};
