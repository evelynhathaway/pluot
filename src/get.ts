import request from "request-promise-native";
import generateFilter from "./filter";
import {log} from "./log";
import {getToken, refreshToken} from "./token";
import {GetType, ParamsType, QueueItem, CalendarType, EventType, EventIdsType, ClientType, UserType} from "./types";


// Add URL parameters to endpoint
const makeFullUrl = function (
	endpoint: string,
	params?: ParamsType
): string {
	let hasParams = false;
	if (params) {
		for (const key in params) {
			endpoint += hasParams ? "&" : (hasParams = true) && "?";
			endpoint += `${encodeURIComponent(key)}=${encodeURIComponent(params[key].toString())}`;
		}
	}

	return endpoint;
};

// Request queue runner
const queueRunner = async function<T = object> (
	this: GetType<T>
): Promise<void> {
	if (this.queue.length === 0) {
		// Nothing is in queue, allow event loop to exit, early return
		this.queueRunnerInt.unref();
		return;
	}

	const {fullUrl, memoize, resolve, reject} = this.queue.shift() as QueueItem;

	// Refresh expired tokens (if needed)
	this.accessToken = await refreshToken(this.accessToken);

	log.verbose(`Requesting ${fullUrl} from API.`);

	// Get authenticated get request to the API
	let result;
	try {
		result = JSON.parse(
			await request.get(
				`https://api.wildapricot.org/publicview/v1${fullUrl}`,
				{"auth": {"bearer": this.accessToken.token.access_token}},
			)
		);
	} catch (error) {
		let errorMsg = "Failed to fetch from API: ";

		if (error.name === "StatusCodeError") {
			switch (error.statusCode) {
				case 401: {
					errorMsg += `Access denied to ${fullUrl}`;
					break;
				}
				case 404: {
					errorMsg += `No resource at ${fullUrl}`;
					break;
				}
				case 428: {
					errorMsg += `User ${this.accountId} should accept Wild Apricot's API terms of use.`;
					break;
				}
				case 429: {
					errorMsg += "The API is rate limiting.";
					break;
				}
				default: {
					errorMsg += `${error.statusCode} ${error.response.statusMessage}`;
				}
			}
		} else {
			errorMsg += `Unknown error while fetching from the API.\n${error}`;
		}

		reject(new Error(errorMsg));
	}

	// Memoize set
	if (memoize) {
		this.memo[fullUrl] = result;
	}

	// Resolve with parsed result
	resolve(result);
};

// Helper function around `request()`
const get = function<T = object> (
	this: GetType<T>,
	endpoint: string,
	params?: ParamsType,
	memoize = false
): Promise<T> {
	const fullUrl: string = makeFullUrl(endpoint, params);

	// Memoize early return
	if (memoize && this.memo[fullUrl]) {
		log.verbose(`Found call ${fullUrl} in cache.`);
		return Promise.resolve(this.memo[fullUrl]);
	}

	// Add queue runner interval
	if (!this.queueRunnerInt) {
		// Queue runner, bound to `this`, can run at a maximum of 200/minute
		this.queueRunnerInt = setInterval(queueRunner.bind(this), 333);
	}
	// Make event loop not exit while there's stuff in queue
	this.queueRunnerInt.ref();

	// Push to queue, pass promise resolvers
	log.verbose(`Adding ${fullUrl} to request queue.`);
	return new Promise((resolve, reject) => {
		this.queue.push({
			fullUrl,
			memoize,
			resolve,
			reject,
		});
	});
};

// Helper functions wrapping around (memoized by default)
get.eventIds = async function<T = object> (
	this: GetType<T>,
	calendar: CalendarType,
	memoize = true
): Promise<EventIdsType> {
	const params: ParamsType = {idsOnly: true};

	const filter: string = generateFilter(calendar.options.filter);
	if (filter) {
		params.$filter = filter;
	}

	return (
		await this(`/accounts/${this.accountId}/events/`, params, memoize) as any
	).EventIdentifiers;
};
get.event = async function<T = object> (
	this: GetType<T>,
	eventId: number,
	memoize = true
): Promise<EventType> {
	return this(`/accounts/${this.accountId}/events/${eventId}`, undefined, memoize) as any;
};


export default async function<T = object> (
	client: ClientType,
	user: UserType
): Promise<GetType<T>> {
	return new Proxy(
		Object.assign(
			() => {},
			{
				memo: {},
				queue: [],
				// Authenticate with WA
				accessToken: await getToken(client, user),
			}
		),
		{
			apply (target: any, thisArg: any, argumentsList: Array<any>) {
				return get.apply(target, argumentsList);
			},
			get (target: any, property: string | number | symbol, receiver: any) {
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
			set (target: any, property: string | number | symbol, value: any, receiver: any) {
				if (property === "accessToken") {
					return Reflect.set(target, property, value, receiver);
				}
				return false;
			},
		}
	);
}
