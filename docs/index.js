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

const getEmbedUrl = (queryType, queryText) => {
    switch (queryType) {
        case 'ttvChannel':
            return '/public/ttv.html#' + encodeURIComponent(getTwitchChannelCommand(queryText));
        case 'ttvVod':
            return '/public/ttv.html#' + encodeURIComponent(getTwitchVodCommand(queryText));
        default:
            return '';
    }
};

/**
 *
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
