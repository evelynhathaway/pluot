import {log} from "./log";
import {MaxType, Partial, FilterType} from "./types";


export const maxAmount = function (amount: number): string {
	return `$top${amount}`;
};

export const dayDelta = function (days: number, upcoming: boolean): Date {
	if (upcoming) {
		// Filter by days past the end date
		const upcomingDate: Date = new Date();
		upcomingDate.setDate(upcomingDate.getDate() + days);
		return upcomingDate;
	} else {
		// Filter by days before the start date
		const pastDate: Date = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days);
		return pastDate;
	}
};

export default function (max: MaxType, filter: Partial<FilterType>): Array<string> {
const {past, upcoming} = max;

	// Warn about specific unused keys
	for (const key of ["amount", "day"]) {
		if (max[key] && (past[key] || upcoming[key])) {
			log.warn(`The global ${key} maximum cannot be used when past or upcoming also has that option set.`);
		}
	}
};
