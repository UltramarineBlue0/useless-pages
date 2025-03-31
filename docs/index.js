"use strict";

document.title = Math.random().toString(2);

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
        default:
            return '';
    }
};

/**
 * (Imho,) The most convenient way to embed Youtube / Twitch is using their script to programmatically create the iframes
 *
 * Unfortunately, YouTube and Twitch embeds need both allow-scripts and allow-same-origin to work. If you want to enforce the sandbox rules and
 * make sure that there is no way that Youtube / Twitch can somehow remove the sandbox or rewrite the feature policy, you need to
 * run their script in a iframe which is served from a different domain than the embedding page. (srcdoc is useless here, since with both
 * allow-scripts and allow-same-origin the document is considered to be from the same origin as the parent document) This way their script
 * can't access the embedding element via window.parent.document.querySelectorAll('iframe').
 *
 * So: Top level page -> iframe from a different domain, in which Youtube / Twitch script is used -> iframe from Youtube / Twitch with the actual
 * video content
 *
 * This is bad: iframe-ception, slower loading time, more code and deployment, even worse: complicated code and deployment.
 * But I can't think of a better way to do it
 *
 * (Also: Different subpages for Youtube and Twitch is probably better. If you add html fragments insertAdjacentHTML() / innerHTML, by
 * default the scripts in those fragments are not executed. You could work around that, but separate pages is probably easier to read
 * and understand than the workaround. (Also running arbitrary code from the URL is terrible security-wise, even if we assume that you
 * can trust your own domains and webpages and it's Youtube and Twitch who are untrustworthy))
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
            this.showIframe = false;
            this.setSrc('about:blank');
            this.setAllow();
            this.setSandbox();

            await this.$nextTick();
            // The iframe cannot be hidden (display: none) when loading the src document. Otherwise some attributes doesn't correctly apply
            this.showIframe = true;
            // Bug in alpine.js or Firefox? If the src is set by alpine.js the same way as the other attributes, the iframe only updates half of the
            // time. Detaching the src attribute update from alpine.js' reactivity fixes the issue. Doesn't happen on Chrome
            setTimeout(() => this.setSrc(getEmbedUrl(this.queryType, this.queryText.trim().normalize())), 9);
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
