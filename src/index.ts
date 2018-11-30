import request from "request-promise-native";
import icalGen from "ical-generator";
import * as oauth2 from "simple-oauth2";


const getToken = async function (
	client: oauth2.ModuleOptions.client,
	user: oauth2.PasswordTokenConfig
): Promise<oauth2.AccessToken> {
	try {
		const authInstance: oauth2.OAuthClient = oauth2.create({
			client,
			auth: {
				tokenHost: "https://oauth.wildapricot.org",
				tokenPath: "/auth/token",
			},
		});
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
			accessToken = await accessToken.refresh();
		} catch (error) {
			// TODO
			throw new Error("Error refreshing access token");
		}
	}
	return accessToken; // remove if it mutates TODO
};


// TODO: WIP
const generateCalendar = async function (
	calendar: Calendar,
	options: Options = {
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
	get: Function
): Promise<icalGen.ICalCalendar> {
	const cal = icalGen({
		"name": calendar.name || calendar.tag,
		"method": "PUBLISH"
	});

	const eventIds: Array<number> = (await get(`/accounts/${userId}/events/?idsOnly=true`))["EventIdentifiers"];
	// TODO date filters, tag filters `&filter=StartDate gt 2015-01-15 AND StartDate lt 2015-06-15`
	for (let eventId of eventIds) {
		const event = await get(`/accounts/${userId}/events/${eventId}`);

		cal.createEvent({
			start: new Date(event["StartDate"]),
			end: new Date(event["EndDate"]),
			summary: event["Name"] || "Event",
			// organizer: "TODO",
			allDay: event["StartTimeSpecified"] && event["EndTimeSpecified"],
		});
	}

	console.log(cal.toString()); // TODO: remove
	return cal;
};


export default async function(
	calendar: Calendar | Array<Calendar>,
	client: oauth2.ModuleOptions.client,
	user: oauth2.PasswordTokenConfig,
	options?: Options,
	// stream?: TODO
): Promise<icalGen.ICalCalendar | Array<icalGen.ICalCalendar>> {
	// Authenticate with WA
	let accessToken: oauth2.AccessToken = await getToken(client, user);

	// ID of authenticated user to view events as
	const userId: number = accessToken["token"]["Permissions"][0]["AccountId"];

	// Helper function around request
	const get = async (endpoint: string) => {
		// Refresh expired tokens
		accessToken = await refreshToken(accessToken); // TODO does refresh mutate the existing token object? If so, remove assign

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

	// Helper function to call `generateCalendar`
	const callGen = function (cal: Calendar) {
		return generateCalendar(
			cal,
			{
				...options,
				...cal.options,
			},
			userId,
			get
		)
	}

	// Call `generateCalendar`, return result(s)
	if (Array.isArray(calendar)) {
		// Break into parrell
		try {
			const promises: Array<Promise<icalGen.ICalCalendar>> = calendar.map(callGen);
		} catch (error) {
			console.log("boops");
		}
		// Await all
		return await Promise.all(promises);
	} else {
		return callGen(calendar);
	}
}
