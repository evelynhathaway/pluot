import deepmerge from "deepmerge";
import generateCalendar from "./calendar";
import {defaultCalendar} from "./defaults";
import makeGet from "./get";
import {emitter, log} from "./log";
import {DeepPartial, CalendarType, OptionsType, GetType, ClientType, UserType, ICalResponseType} from "./types";


export {emitter as log};


export default async function (
	calendar: DeepPartial<CalendarType> | Array<DeepPartial<CalendarType>>,
	client: ClientType,
	user: UserType,
	options: DeepPartial<OptionsType> = {},
): Promise<ICalResponseType | Array<ICalResponseType>> {
	// Create get function for authenticated requests to the WA API
	const get: GetType = await makeGet(client, user);

	const mergedCalendar: CalendarType = deepmerge.all([{}, defaultCalendar, {options}]) as CalendarType;
	// Helper function to call `generateCalendar`
	const callGen = function (cal: DeepPartial<CalendarType>) {
		return generateCalendar(
			deepmerge(mergedCalendar, cal),
			get,
		);
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
