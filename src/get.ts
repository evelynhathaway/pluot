import * as oauth2 from "simple-oauth2";
import request from "request-promise-native";
import {getToken, refreshToken} from "./token";
import {log} from "./log";
import {GetType, EventType, EventIdsType} from "./types";


// Helper function around `request()`
const get = async function<T = object> (
	this: GetType<T>,
	endpoint: string,
	memoize: boolean = false
): Promise<T> {
	// Memoize early return and log
	if (memoize && this.memo[endpoint]) {
		log(`Found call ${endpoint} in cache.`);
		return this.memo[endpoint];
	} else {
		log(`Requesting ${endpoint} from API.`);
	}

	// Refresh expired tokens
	this.accessToken = await refreshToken(this.accessToken);

	// Return authenticated get request to the API
	const result = await request.get(
			`https://api.wildapricot.org/publicview/v1${endpoint}`,
			{"auth": {"bearer": this.accessToken.token["access_token"]}}
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

	// Memoize set
	if (memoize) {
		this.memo[endpoint] = result;
	}

	return result;
};

// Helper functions wrapping around (memoized by default)
get.eventIds = async function<T = object> (
	this: GetType<T>,
	filter: string,
	memoize: boolean = true
): Promise<EventIdsType> {
	return (<any>
		await this(`/accounts/${this.accountId}/events/?idsOnly=true${filter ? `&$filter=${filter}` : ""}`, memoize)
	)["EventIdentifiers"];
};
get.event = async function<T = object> (
	this: GetType<T>,
	eventId: number,
	memoize: boolean = true
): Promise<EventType> {
	return <any>this(`/accounts/${this.accountId}/events/${eventId}`, memoize);
};


export default async function<T = object> (
	client: oauth2.ModuleOptions["client"],
	user: oauth2.PasswordTokenConfig
): Promise<GetType<T>> {
	return new Proxy(
		Object.assign(
			() => {},
			{
				memo: {},
				// Authenticate with WA
				accessToken: await getToken(client, user),
			}
		),
		{
			apply(target: any, thisArg: any, argumentsList: Array<any>) {
				return get.apply(target, argumentsList);
			},
			get(target: any, property: string | number | symbol, receiver: any) {
				if (property === "accountId") {
					// Dynamic shortcut for the ID of authenticated user to view events as
					return target.accessToken.token.Permissions[0].AccountId;
				} else if (target.hasOwnProperty(property)) {
					// Use property from self
					return Reflect.get(target, property, receiver);
				} else {
					// Use property from get
					return Reflect.get(get, property, receiver);
				}
			},
			set(target: any, property: string | number | symbol, value: any, receiver: any) {
				if (property === "accessToken") {
					return Reflect.set(target, property, value, receiver);
				}
				return false;
			},
		}
	);
};
