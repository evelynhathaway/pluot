interface OauthClient {
	id: string,
	secret: string,
}
interface OauthUser {
	username: string,
	password: string,
	scope?: string,
}
// Extend icalgen TODO
interface Calendar {
	tag?: string,
	url?: string,
	name?: string,
	description?: string,
	options?: Options,
}
interface Options {
	appendLinkToCalendarDescription?: boolean,
	appendLinkToEventDescription?: boolean,
	maxFileSize?: number,
	maxPastEvents?: number | false,
	maxPastEventsDayDelta?: number | false,
	maxUpcomingEvents?: number | false,
	maxUpcomingEventsDayDelta?: number | false,
	truncateEventDescription?: boolean,
}


const defaultOptions: Options = {
	appendLinkToCalendarDescription: true,
	appendLinkToEventDescription: true,
	maxFileSize: 1000000,
	maxPastEvents: false,
	maxPastEventsDayDelta: 31,
	maxUpcomingEvents: false,
	maxUpcomingEventsDayDelta: 365,
	truncateEventDescription: false,
}


import request from "request-promise-native";
import oauth2 from "simple-oauth2";
import ical from "ical-generator";

const getToken = async function (client: OauthClient, user: OauthUser) {
	try {
		const authInstance = oauth2.create({
			client,
			auth: {
				tokenHost: "https://oauth.wildapricot.org",
				tokenPath: "/auth/token",
			},
		});
		const result = await authInstance.ownerPassword.getToken({
			scope: [
				"contacts_me",
				"events_view",
			],
			...user,
		});
		return authInstance.accessToken.create(result);
	} catch (error) {
		// TODO
		throw new Error("Access Token Error");
	}
};

const refreshToken = async function (accessToken: oauth2.AccessToken) {
	if (accessToken.expired()) {
		try {
			accessToken = await accessToken.refresh();
		} catch (error) {
			// TODO
			throw new Error("Error refreshing access token");
		}
	}
	return accessToken;
};


// TODO: WIP
const generateCalendar = async function (calendar: Calendar, options: Options) {
	const cal = ical({
		"name": calendar.name || tag.name,
		"method": "PUBLISH"
	});

	const eventIds: Array<number> = (await get(`/accounts/${userId}/events/?idsOnly=true&filter=StartDate gt 2015-01-15 AND StartDate lt 2015-06-15`))["EventIdentifiers"];
	for (let eventId of eventIds) {
		const event = await get(`/accounts/${userId}/events/${eventId}`);

		cal.createEvent({
			start: new Date(event["StartDate"]),
			end: new Date(event["EndDate"]),
			summary: event["Name"] || "Event",
			organizer: "TODO",
			allDay: event["StartTimeSpecified"] && event["EndTimeSpecified"],
		});
	}

	console.log(cal.toString());
	return cal.toString();
};


export default async function(
	calendar: Calendar | Array<Calendar>,
	client: OauthClient,
	user: OauthUser,
	options?: Options,
	// stream?: TODO
) {
	// Authenticate with WA
	let accessToken: oauth2.AccessToken = await getToken(client, user);
	// ID of authenticated user to view events as
	const userId: number = accessToken["token"]["Permissions"][0]["AccountId"];
	// Helper function around request
	const get = async (endpoint: string) => {
		// Refresh expired tokens
		accessToken = await refreshToken(accessToken);

		// Return authenticated get request to the API
		return (
			request
				.get(
					`https://api.wildapricot.org/publicview/v1${endpoint}`,
					{
						"auth": {
							"bearer": accessToken.token["access_token"]
						}
					}
				)
				.then(JSON.parse)
				// TODO
				.catch(error => {
					if (error.name === "StatusCodeError") {
						throw new Error(`Failed to fetch from API: ${error.statusCode} ${error.response.statusMessage}`);
					} else {
						throw new Error("Unknown error while fetching from the API.");
					}
				})
		);
	};

	// TODO
	if (Array.isArray(calendar)) {
		// Break into parrell
		const results = [];
		for (const cal of calendar) {
			results.push(generateCalendar(
				cal,
				{
					...defaultOptions,
					...options,
					...cal.options,
				}
			));
		}
		// Await all
		for (const result of results) {
			await result;
		}
		return results;
	} else {
		return await generateCalendar(
			calendar,
			{
				...defaultOptions,
				...options,
				...calendar.options,
			}
		);
	}
}
