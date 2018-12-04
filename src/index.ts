import request from "request-promise-native";
import icalGen from "ical-generator";
import * as oauth2 from "simple-oauth2";
import {emitter, log} from "./log";
import generateCalendar from "./calendar";
import {getToken, refreshToken} from "./token";
import {CalendarType, OptionsType, GetType, EventType, EventIdsType} from "./types";


export {emitter as log};


export default async function (
	calendar: CalendarType | Array<CalendarType>,
	client: oauth2.ModuleOptions["client"],
	user: oauth2.PasswordTokenConfig,
	options?: OptionsType,
): Promise<icalGen.ICalCalendar | Array<icalGen.ICalCalendar>> {
	// Authenticate with WA
	let accessToken: oauth2.AccessToken = await getToken(client, user);

	// ID of authenticated user to view events as
	const userId: number = accessToken["token"]["Permissions"][0]["AccountId"];

	// Helper function around `request()`
	const get: GetType = Object.assign(
		async (endpoint: string): Promise<object> => {
			// Refresh expired tokens
			accessToken = await refreshToken(accessToken);

			// Return authenticated get request to the API
			return request.get(
					`https://api.wildapricot.org/publicview/v1${endpoint}`,
					{"auth": {"bearer": accessToken.token["access_token"]}}
				)
				.then(JSON.parse)
				.catch(error => {
					// TODO
					if (error.name === "StatusCodeError") {
						throw new Error(`Failed to fetch from API: ${error.statusCode} ${error.response.statusMessage}`);
					} else {
						throw new Error("Unknown error while fetching from the API.");
					}
				});
		},
		{
			// Memoized helper functions wrapping around `get()`
			memo: {
				eventIds: {},
				event: {},
			},
			eventIds: async (userId: number, filter: string): Promise<EventIdsType> => {
				const filterMsg = filter ? `filtered by: "${filter}"` : "without a filter";

				if (get.memo.eventIds[filter]) {
					log(`Found event IDs ${filterMsg} in cache.`);
					return get.memo.eventIds[filter];
				} else {
					log(`Fetching event IDs ${filterMsg} from API.`);
					return get.memo.eventIds[filter] = (
						await get(`/accounts/${userId}/events/?idsOnly=true&$filter=${filter}`)
					)["EventIdentifiers"];
				}
			},
			event: async (userId: number, eventId: number): Promise<EventType> => {
				if (get.memo.event[eventId]) {
					log(`Found event ${eventId} in cache.`);
					return get.memo.event[eventId];
				} else {
					log(`Fetching event ${eventId} from API.`);
					return get.memo.event[eventId] = await get(`/accounts/${userId}/events/${eventId}`);
				}
			}
		}
	);

	// Helper function to call `generateCalendar`
	const callGen = function (cal: CalendarType) {
		return generateCalendar(
			cal,
			{
				...options,
				...cal.options,
			},
			userId,
			get
		)
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
