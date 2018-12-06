import {CalendarType} from "./types";


// Convert native date objects to YYYY-MM-DD
const toISODate = (date: Date): string => date.toISOString().replace(/T.*$/i, "");


export default function (calendar: CalendarType) {
	// TODO: ID, Name, RegistrationEnabled, TextIndex, manual date range
	// TODO: use `$sort`, `$top`, and `$filter=IsUpcoming eq true` for max events?
	const {tag} = calendar;
	const {maxPastEventsDayDelta, maxUpcomingEventsDayDelta} = calendar.options;
	const filter: Array<string> = [];

	// Filter by tag(s)
	if (tag) {
		// TODO: document if it's `any in` or `all in`
		filter.push(`Tags in [${Array.isArray(tag) ? tag.join(",") : tag}]`);
	}
	// Filter by days past the end date
	if (typeof maxPastEventsDayDelta === "number") {
		const pastDate: Date = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * maxPastEventsDayDelta);
		filter.push(`EndDate ge ${toISODate(pastDate)}`);
	}
	// Filter by days before the start date
	if (typeof maxUpcomingEventsDayDelta === "number") {
		const upcomingDate: Date = new Date();
		upcomingDate.setDate(upcomingDate.getDate() + maxUpcomingEventsDayDelta);
		filter.push(`StartDate le ${toISODate(upcomingDate)}`);
	}

	// Return as string with `AND` logical operator
	return filter.join(" AND ");
}
