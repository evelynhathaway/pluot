import {EventEmitter} from "events";
import request from "request-promise-native";
import icalGen from "ical-generator";
import * as oauth2 from "simple-oauth2";
import {CalendarType, OptionsType, GetType, EventType, EventIdsType} from "./types";


const log = new EventEmitter();
export {log};


const getToken = async function (
	client: oauth2.ModuleOptions["client"],
	user: oauth2.PasswordTokenConfig
): Promise<oauth2.AccessToken> {
	try {
		log.emit("message", "Creating Oatuh2 instance with the client credentials.");
		const authInstance: oauth2.OAuthClient = oauth2.create({
			client,
			auth: {
				tokenHost: "https://oauth.wildapricot.org",
				tokenPath: "/auth/token",
			},
		});
		log.emit("message", "Creating a token for user credentials.");
		const token: oauth2.Token = await authInstance.ownerPassword.getToken({
			scope: [
				"contacts_me",
				"events_view",
			],
			...user,
		});
		return authInstance.accessToken.create(token);
	} catch (error) {
		// TODO
		throw new Error("Access Token Error");
	}
};

const refreshToken = async function (accessToken: oauth2.AccessToken): Promise<oauth2.AccessToken> {
	if (accessToken.expired()) {
		try {
			log.emit("message", "Token has expired, refreshing token.");
			return accessToken = await accessToken.refresh();
		} catch (error) {
			// TODO
			throw new Error("Error refreshing access token");
		}
	}
	return accessToken;
};

const generateFilter = function (
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

// TODO: WIP
const generateCalendar = async function (
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
	userId: number,
	get: GetType
): Promise<icalGen.ICalCalendar> {
	const cal = icalGen({
		"name": calendar.name,
		"method": "PUBLISH"
	});

	const filter: string = generateFilter({tag: calendar.tag});
	const eventIds: EventIdsType = await get.eventIds(userId, filter);

	log.emit("message", `Fetching ${eventIds.length} events.`);
	for (let eventId of eventIds) {
		const event = await get.event(userId, eventId);

		log.emit("message", `Adding event "${event["Name"]}" to "${calendar.name}".`);
		cal.createEvent({
			start: new Date(event["StartDate"]),
			end: new Date(event["EndDate"]),
			summary: event["Name"] || "Event",
			// organizer: "TODO",
			allDay: event["StartTimeSpecified"] && event["EndTimeSpecified"],
		});
	}

	return cal;
};

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
					log.emit("message", `Found event IDs ${filterMsg} in cache.`);
					return get.memo.eventIds[filter];
				} else {
					log.emit("message", `Fetching event IDs ${filterMsg} from API.`);
					return get.memo.eventIds[filter] = (
						await get(`/accounts/${userId}/events/?idsOnly=true&$filter=${filter}`)
					)["EventIdentifiers"];
				}
			},
			event: async (userId: number, eventId: number): Promise<EventType> => {
				if (get.memo.event[eventId]) {
					log.emit("message", `Found event ${eventId} in cache.`);
					return get.memo.event[eventId];
				} else {
					log.emit("message", `Fetching event ${eventId} from API.`);
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
		log.emit("message", `Returning promise for all calendars: [${calendar.map(cal => cal.name).join(", ")}]`);
		result = await Promise.all(calendar.map(callGen));
	} else {
		log.emit("message", `Returning promise for single calendar: ${calendar.name}`);
		result = await callGen(calendar);
	}

	log.emit("message", "Finished.");
	return result;
}
