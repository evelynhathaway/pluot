import {Partial, FilterType, HasToStringType} from "./types";


// Convert native date objects to YYYY-MM-DD
const toISODate = (date: Date): string => date.toISOString().replace(/T.*$/i, "");

// Helpers
export const eqHelper = function (key: string, value: string | HasToStringType): string {
	return `${key} eq ${value}`;
};
export const inHelper = function (key: string, value: string | HasToStringType | Array<string | HasToStringType>): string {
	return `${key} in [${Array.isArray(value) ? value.join(",") : value}]`;
};
export const dateHelper = function (date: Date | string, upcoming: boolean): string {
	if (date instanceof Date) {
		date = toISODate(date);
	}

	if (upcoming) {
		return `StartDate le ${date}`;
	} else {
		return `EndDate ge ${date}`;
	}
};

export default function (filter: Partial<FilterType>): string {
	const result: Array<string> = [];
	// `in` helper filters
	if (filter.tag) {
		result.push(inHelper("Tags", filter.tag));
	}
	if (filter.id) {
		result.push(inHelper("ID", filter.id));
	}
	// `eq` helper filters
	if (filter.upcoming) {
		result.push(inHelper("IsUpcoming", filter.upcoming));
	}
	if (filter.registrable) {
		result.push(inHelper("RegistrationEnabled", filter.registrable));
	}
	// Date helper filters
	if (filter.before) {
		result.push(dateHelper(filter.before, true));
	}
	if (filter.after) {
		result.push(dateHelper(filter.after, false));
	}
	// Manual filter
	if (filter.manual) {
		result.push(`(${filter.manual})`); // Isolated by parentheses
	}

	// Return as string with `AND` logical operator
	return result.join(" AND ");
};
