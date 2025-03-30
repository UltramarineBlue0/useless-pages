"use strict";

document.title = Math.random().toString(2);

const getEmbedDocument = () => {
    return `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <meta name="theme-color" content="black">
</head>

<body>
    <h1>Hello</h1>
</body>
</html>`;
};

document.addEventListener('alpine:init', () => {

    Alpine.data('embed', () => ({
        showSrcDoc: false,
        showDialog: true,
        embedUrl: '',
        embedDocument: '',
        sandboxAttr:'',
        allowAttr:'',

        allowEncryptedMedia: false,
        enableScripts: false,
        enableSameOrigin: false,

        async loadIframe() {
            console.dir(this);
            this.setAllow();
            this.setSandbox();

            await this.$nextTick();
            this.embedDocument = getEmbedDocument();
            this.showSrcDoc = true;
        },

        setAllow() {
            this.allowAttr = "accelerometer 'none'; ambient-light-sensor 'none'; attribution-reporting 'none'; autoplay 'none'; bluetooth 'none'; browsing-topics 'none'; camera 'none'; compute-pressure 'none'; cross-origin-isolated 'none'; display-capture 'none'; document-domain 'none'; fullscreen 'none'; geolocation 'none'; gyroscope 'none'; hid 'none'; identity-credentials-get 'none'; idle-detection 'none'; local-fonts 'none'; magnetometer 'none'; microphone 'none'; midi 'none'; otp-credentials 'none'; payment 'none'; picture-in-picture 'none'; publickey-credentials-create 'none'; publickey-credentials-get 'none'; screen-wake-lock 'none'; serial 'none'; storage-access 'none'; usb 'none'; web-share 'none'; window-management 'none'; xr-spatial-tracking 'none'; ";
            if (this.allowEncryptedMedia) {
                this.allowAttr = this.allowAttr.concat(" encrypted-media * ;");
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

        toggleFullscreen() {

        }
    }));
});
