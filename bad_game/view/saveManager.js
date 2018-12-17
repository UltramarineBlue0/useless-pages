"use strict";

const cookieKey = "globalgamestate";
const cookieSetting = `;samesite=strict;max-age=2147483647;path=/`;

// Cookie is the most compatible storage across most browsers and possible settings. Other types of storage like indexedDB or
// localStorage has issues with private mode in some browsers. Downside: the save game is transmitted to the server with every request
// for no purpose. Since only one save is supported and the save shouldn't be very large, I prefer convenience and compatibility over performance on
// game load

export const saveGame = () => {
	const data = encodeURIComponent(JSON.stringify(self.GlobalGameState));
	document.cookie = `${cookieKey}=${data}${cookieSetting}`;
};

export const loadGame = () => {
	try {
		const currentStorage = document.cookie.split(";");
		const save = currentStorage.find(data => data.trim().startsWith(cookieKey + "="));
		if (save) {
			const jsonString = decodeURIComponent(save.trim().split("=")[1]);
			Object.assign(self.GlobalGameState, JSON.parse(jsonString));
			return true;
		}
	} catch { }
	return false;
};
