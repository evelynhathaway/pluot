import {CalendarType, OptionsType} from "./types";


export default function (
	options: {
		tag?: CalendarType["tag"],
		maxPast?: OptionsType["maxPastEventsDayDelta"],
		maxUpcoming?: OptionsType["maxUpcomingEventsDayDelta"],
		// TODO: ID, Name, RegistrationEnabled, TextIndex
	}
) {
	const {tag} = options;
	let filter = "";
	if (tag) {
		filter += `Tags in [${Array.isArray(tag) ? tag.join(",") : tag}]`;
	}
	// TODO StartDate gt 2015-01-15 AND StartDate lt 2015-06-15
	return filter;
}
