"use strict";

document.title = (Math.random() * 65536).toString(2);

(names => {
    for (const name of names) {
        const element = document.createElement('meta');
        element.name = name;
        element.content = (Math.random() * 65536).toString(36);
        document.head.appendChild(element);
    }
})(['application-name', 'author', 'description', 'generator', 'keywords', 'creator', 'publisher']);

const getTwitchChannelCommand = (queryText) => {
    return JSON.stringify([0, queryText]);
};

const getTwitchVodCommand = (queryText) => {
    try {
        // url format: https://www.twitch.tv/videos/{a large number}
        const url = new URL(queryText);
        const pathArray = url.pathname.split("/");
        let lastPath = pathArray[pathArray.length - 1];
        if (!lastPath.startsWith('v')) {
            lastPath = 'v' + lastPath;
        }
        return JSON.stringify([1, lastPath]);
    } catch (e) {
        console.error(e);
        return '';
    }
};

const getYoutubeVideoCommand = (queryText) => {
    try {
        const url = new URL(queryText);
        if (url.hostname.toLowerCase().endsWith('youtu.be')) {
            // url format: https://youtu.be/{video id}
            const pathArray = url.pathname.split("/");
            const lastPath = pathArray[pathArray.length - 1];
            return JSON.stringify([0, lastPath]);
        } else {
            // url format: https://www.youtube.com/watch?v={video id}
            return JSON.stringify([0, url.searchParams.get('v')]);
        }
    } catch (e) {
        console.error(e);
        return '';
    }
};

const getYoutubePlaylistCommand = (queryText) => {
    try {
        // url format: https://www.youtube.com/playlist?list={long string}
        const url = new URL(queryText);
        return JSON.stringify([1, url.searchParams.get('list')]);
    } catch (e) {
        console.error(e);
        return '';
    }
};

const urlPrefix = 'https://ultramarineblue.gitlab.io/useless-pages/';

/**
 * Think of this as some form of IPC: the embedded pages are functions and their calling parameters are
 * encoded as JSON array in the hash of the URL
 */
const getEmbedUrl = (queryType, queryText) => {
    switch (queryType) {
        case 'ttvChannel':
            return urlPrefix + 'ttv.html#' + encodeURIComponent(getTwitchChannelCommand(queryText));
        case 'ttvVod':
            return urlPrefix + 'ttv.html#' + encodeURIComponent(getTwitchVodCommand(queryText));
        case 'ytVideo':
            return urlPrefix + 'yt.html#' + encodeURIComponent(getYoutubeVideoCommand(queryText));
        case 'ytPlaylist':
            return urlPrefix + 'yt.html#' + encodeURIComponent(getYoutubePlaylistCommand(queryText));
        default:
            return '';
    }
};

/**
 * Some sites, like Youtube and Twitch, offer convenient scripts to embed their content into any other page. These scripts even offer some
 * control over the embedded content. Unfortunately, this means that you have to execute foreign, untrustworthy scripts in the browsing
 * context of your page, which can read any data your scripts can read and do anything your scripts can do.
 *
 * For HTML and CSS, ShadowDOM offer a way to isolate elements on the same page from each other. However no such tool exist for JavaScript,
 * all scripts, including those in a custom element, runs in the global scope of a browsing context. To isolate scripts from each other
 * and prevent untrustworthy scripts from accessing your data, you have to create a new, isolated browsing context using an sandboxed
 * iframe. A iframe with sandbox="allow-scripts" is considered to be from a opaque and unique origin. Therefore it is treated as
 * cross-origin to any other sites, including itself (the actual src). Unfortunately, YouTube and Twitch embeds require both allow-scripts
 * and allow-same-origin to work.
 *
 * If you want to enforce the sandbox rules and make sure that there is no way that Youtube / Twitch can somehow remove the sandbox or
 * rewrite the feature policy, you need to run their script in a iframe which is served from a different domain than the embedding page.
 * (srcdoc is useless here, since with both allow-scripts and allow-same-origin the document is considered to be from the same origin as
 * the parent document.) This way their script can't access the embedding element via window.parent.document.querySelectorAll('iframe').
 *
 * So: Top level page -> iframe from a different domain, in which Youtube / Twitch script is used -> iframe from Youtube / Twitch with the
 * actual video content
 *
 * This is bad: iframe-ception, slower loading time, more complex code and deployment
 * But I can't think of a better way to do it
 */
document.addEventListener('alpine:init', () => {

    Alpine.data('embed', () => ({
        showIframe: false,
        showDialog: true,
        sandboxAttr: '',
        allowAttr: '',
        queryType: 'ytVideo',
        queryText: '',

        allowEncryptedMedia: false,
        enableScripts: true,
        enableSameOrigin: true,

        async loadIframe() {
            const embedUrl = getEmbedUrl(this.queryType, this.queryText.trim().normalize());
            this.showIframe = false;
            await this.$nextTick();

            this.setAllow();
            this.setSandbox();
            this.showIframe = true;

            await this.$nextTick();
            this.setSrc(embedUrl);
        },

        setSrc(url) {
            this.$refs.iframeElement.src = url;
        },

        setAllow() {
            this.allowAttr = "accelerometer 'none'; ambient-light-sensor 'none'; attribution-reporting 'none'; autoplay 'none'; bluetooth 'none'; browsing-topics 'none'; camera 'none'; compute-pressure 'none'; cross-origin-isolated 'none'; display-capture 'none'; document-domain 'none'; fullscreen 'none'; gamepad 'none'; geolocation 'none'; gyroscope 'none'; hid 'none'; identity-credentials-get 'none'; idle-detection 'none'; local-fonts 'none'; magnetometer 'none'; microphone 'none'; midi 'none'; otp-credentials 'none'; payment 'none'; picture-in-picture 'none'; publickey-credentials-create 'none'; publickey-credentials-get 'none'; screen-wake-lock 'none'; serial 'none'; speaker-selection 'none'; storage-access 'none'; usb 'none'; web-share 'none'; window-management 'none'; xr-spatial-tracking 'none'; ";
            if (this.allowEncryptedMedia) {
                this.allowAttr = this.allowAttr.concat(" encrypted-media * ;");
            } else {
                this.allowAttr = this.allowAttr.concat(" encrypted-media 'none';");
            }
        },

        setSandbox() {
            this.sandboxAttr = '';
            if (this.enableScripts) {
                this.sandboxAttr = this.sandboxAttr.concat('allow-scripts ');
            }
            if (this.enableSameOrigin) {
                this.sandboxAttr = this.sandboxAttr.concat('allow-same-origin ');
            }
        },

    }));
});
