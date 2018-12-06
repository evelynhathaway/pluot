import icalGen from "ical-generator";
import * as oauth2 from "simple-oauth2";
import {emitter, log} from "./log";
import generateCalendar from "./calendar";
import makeGet from "./get";
import {defaultCalendar, defaultOptions} from "./defaults";
import {CalendarType, OptionsType, GetType} from "./types";


export {emitter as log};


export default async function (
	calendar: CalendarType | Array<CalendarType>,
	client: oauth2.ModuleOptions["client"],
	user: oauth2.PasswordTokenConfig,
	options?: OptionsType,
): Promise<icalGen.ICalCalendar | Array<icalGen.ICalCalendar>> {
	// Create get function for authenticated requests to the WA API
	const get: GetType = await makeGet(client, user);

	// Helper function to call `generateCalendar`
	const callGen = function (cal: CalendarType) {
		cal.options = {...defaultOptions, ...options, ...cal.options};
		return generateCalendar({...defaultCalendar, ...cal}, get);
	};

	// Call `generateCalendar`, return result(s)
	let result;
	if (Array.isArray(calendar)) {
		log(`Returning promise for all calendars: [${calendar.map(cal => cal.name).join(", ")}]`);
		result = await Promise.all(calendar.map(callGen));
	} else {
		log(`Returning promise for single calendar: ${calendar.name}`);
		result = await callGen(calendar);
	}

	log("Finished.");
	return result;
}
