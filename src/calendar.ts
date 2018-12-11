import icalGen from "ical-generator";
import {promisify} from "util";
import {log} from "./log";
import {sanitize} from "./description";
import {plaintextSanitizeOptions} from "./defaults";
import {CalendarType, GetType, EventType, EventIdsType, ICalResponseType} from "./types";


export default async function (
	calendar: CalendarType,
	get: GetType
): Promise<ICalResponseType> {
	const ical = icalGen(calendar);

	const eventIds: EventIdsType = await get.eventIds(calendar);

	log(`Fetching ${eventIds.length} events for ${calendar.name}`);
	for (let eventId of eventIds) {
		const event: EventType = await get.event(eventId);

		// Remove newlines and any following spaces from description
		// The spaces cause issues on Google Calendar for web
		const description = event.Details.DescriptionHtml.replace(/\r?\n */g, "");
		// Clean and plain descriptions
		const cleanDescription = sanitize(
			description,
			calendar.options.events.description.sanitize,
		);
		const plainDescription = sanitize(
			description,
			plaintextSanitizeOptions,
		);

		log(`Adding event "${event.Name}" to "${calendar.name}".`);

		ical.createEvent({
			uid: event.Id.toString(),
			start: new Date(event.StartDate),
			end: new Date(event.EndDate),
			summary: event.Name || "Untitled Event",
			organizer: event.Details.Organizer || undefined,
			allDay: event.StartTimeSpecified && event.EndTimeSpecified,
			description: cleanDescription, // TODO: implement plainDescription's options
			htmlDescription: cleanDescription,
			location: event.Location,
		});
	}

	console.log(calendar.options.save)

	if (calendar.options.save) {
		// Create a promise for saving to file, bound to the ical
		const icalSaveAsync = promisify(ical.save.bind(ical));
		try {
			await icalSaveAsync(calendar.options.save.path);
		} catch (error) {
			throw new Error(`There was an error while saving to ${calendar.options.save.path}: ${error}`);
		}
	}

	return ical;
}
