"use strict";

document.title = Math.random().toString(2);

const getFragmentForTwitch = () => {
    return `<script async="false" src="https://embed.twitch.tv/embed/v1.js"></script>

    <script async="false">
      console.log(Twitch);
      const player = new Twitch.Embed('player', {
        autoplay: false,
        muted: true,
        channel: "shroud",
        parent: ["localhost"],
      });
    </script>`;
};

const getEmbedUrl = () => {
    return './player.html#' + encodeURIComponent(getFragmentForTwitch());
};

document.addEventListener('alpine:init', () => {

    Alpine.data('embed', () => ({
        showIframe: false,
        showDialog: true,
        embedUrl: '',
        sandboxAttr: '',
        allowAttr: '',

        allowEncryptedMedia: false,
        enableScripts: false,
        enableSameOrigin: false,

        async loadIframe() {
            this.setAllow();
            this.setSandbox();
            this.embedUrl = '';
            this.showIframe = true;

            await this.$nextTick();
            this.embedUrl = getEmbedUrl();
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
            this.sandboxAttr = ' ';
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
