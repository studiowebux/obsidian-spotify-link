import { getMe, generateLoginUrl, REDIRECT_URI } from "./api";

export async function onAutoLogin(
	clientId: string
): Promise<{ success: boolean; spotifyUrl: string }> {
	const profile = await getMe(clientId);
	return profile
		? { success: true, spotifyUrl: profile.external_urls.spotify }
		: { success: false, spotifyUrl: "" };
}

export function onLogin(clientId: string, state: string, scope: string): void {
	window.open(generateLoginUrl(clientId, state, scope, REDIRECT_URI));
}
