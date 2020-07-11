import * as oauth2 from "simple-oauth2";
import {log} from "./log";


export const getToken = async function (
	client: oauth2.ModuleOptions["client"],
	user: oauth2.PasswordTokenConfig
): Promise<oauth2.AccessToken> {
	try {
		log("Creating Oatuh2 instance with the client credentials.");
		const authInstance: oauth2.OAuthClient = oauth2.create({
			client,
			auth: {
				tokenHost: "https://oauth.wildapricot.org",
				tokenPath: "/auth/token",
			},
		});
		log("Creating a token for user credentials.");
		const token: oauth2.Token = await authInstance.ownerPassword.getToken({
			scope: [
				"contacts_me",
				"events_view",
			],
			...user,
		});
		return authInstance.accessToken.create(token);
	} catch {
		throw new Error("There was an error while creating an access token.");
	}
};


export const refreshToken = async function (
	accessToken: oauth2.AccessToken
): Promise<oauth2.AccessToken> {
	if (accessToken.expired()) {
		try {
			log("Token has expired, refreshing token.");
			return accessToken = await accessToken.refresh();
		} catch {
			throw new Error("There was an error while refreshing the access token.");
		}
	}
	return accessToken;
};
