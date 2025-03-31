"use strict";

const buildSrcDoc = (body = "") => `
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<meta http-equiv="content-security-policy"
		content="block-all-mixed-content; object-src 'none'; form-action 'none'; base-uri 'none'; default-src http: https: 'self';">
	<meta name="referrer" content="no-referrer">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<title>Child iframe</title>

	<link href="${new URL("./iframe.css", location)}" rel="stylesheet">
	<script defer type="module" src="${new URL("./iframe.js", location)}"></script>
</head>

<body>
	${body}
</body>

</html>`;

const allowScripts = "allow-scripts";
const allowForms = "allow-forms";
const allowSameOrigin = "allow-same-origin";

const embedIframe = document.getElementById("contentIframe");

embedIframe.sandbox.add(allowScripts, allowSameOrigin);
embedIframe.sandbox.remove(allowForms);

// Testing done in a sandboxed iframe using simple embeds without any custom clients

/* Twitch: doesn't work in srcdoc iframe because twitch's csp frame-ancestor can't specify those browsing contexts
embedIframe.srcdoc = buildSrcDoc(`
<div id="twitch-embed" class="embed-box"></div>
<script src="https://embed.twitch.tv/embed/v1.js"></script>
`);
*/

/* Twitter: some functionality requires opening the full webpage. Nevertheless, it's useable for displaying tweets
embedIframe.srcdoc = buildSrcDoc(`
<blockquote class="twitter-tweet" data-dnt="true" data-theme="dark"><p lang="en" dir="ltr">Brant: Is Charlie a Havanese? I have 2 of them and can report, without a shadow of a doubt, that they are very, very good dogs. <a href="https://t.co/HgNe8ccP0g">pic.twitter.com/HgNe8ccP0g</a></p>&mdash; Bryant Spann (@bryantspann) <a href="https://twitter.com/bryantspann/status/1021432292806406144?ref_src=twsrc%5Etfw">July 23, 2018</a></blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
`);
*/

/* Reddit comment: Can't control how many levels of responses it'll show. Limited usefulness
embedIframe.srcdoc = buildSrcDoc(`
<div class="reddit-embed" data-embed-media="www.redditmedia.com" data-embed-parent="true" data-embed-live="true" data-embed-uuid="f86cb2a2-41d7-46ef-a056-0c8878c76882" data-embed-created="2020-07-05T00:25:34.347Z">
<a href="https://old.reddit.com/r/SubredditDrama/comments/3bwgjf/riama_set_to_private_over_mod_firing/csqg24d/">Comment</a> from discussion <a href="https://old.reddit.com/r/SubredditDrama/comments/3bwgjf/riama_set_to_private_over_mod_firing/">/r/IAmA set to private over mod firing</a>.
</div>
<script async src="https://www.redditstatic.com/comment-embed.js"></script>
`);
*/

/* Reddit post: Can't display the comments below the post. Limited usefulness
embedIframe.srcdoc = buildSrcDoc(`
<blockquote class="reddit-card"><a href="https://www.reddit.com/r/announcements/comments/5frg1n/tifu_by_editing_some_comments_and_creating_an/">TIFU by editing some comments and creating an unnecessary controversy.</a> from <a href="http://www.reddit.com/r/announcements">r/announcements</a></blockquote>
<script async src="https://embed.redditmedia.com/widgets/platform.js"></script>
`);
*/

// Strange behaviour when clicking links, otherwise it works fine
// embedIframe.src = "https://www.pornhub.com/embed/ph5c0f02ca7948b";

// No volume control makes it almost useless on desktop
// embedIframe.src = "https://open.spotify.com/embed/playlist/3UTeUqSzaT1FMJtgw6hmRp";

// There is a JS API for the SoundCloud iframe embed, similar to YouTube. That API can control the audio volume.
// embedIframe.src = "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/346110701&auto_play=false";
