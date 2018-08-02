"use strict";
(() => {
	const basePath = "https://www.youtube.com/embed?";
	const additionalParams = "&iv_load_policy=1&autoplay=0&controls=1&disablekb=0&enablejsapi=0&fs=1&hl=en&modestbranding=1&playsinline=1&rel=1&showinfo=1";

	const formElement = document.getElementById("form");
	const queryType = document.getElementById("type");
	const queryInput = document.getElementById("query");
	const youtube = document.getElementById("yt-iframe");

	formElement.addEventListener("submit", event => {
		event.preventDefault();
		event.stopImmediatePropagation();

		const type = "listType=" + queryType.value;
		const query = "list=" + encodeURIComponent(queryInput.value);
		const url = basePath + type + "&" + query + additionalParams;

		youtube.src = url;
	});
})();