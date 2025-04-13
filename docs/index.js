"use strict";

document.title = 'Test Page ' + ((Math.random() * 65536).toString(2).split('.')[0]);

(names => {
    for (const name of names) {
        const element = document.createElement('meta');
        element.name = name;
        element.content = (Math.random() * 65536).toString(36);
        document.head.appendChild(element);
    }
})(['application-name', 'author', 'description', 'generator', 'keywords', 'creator', 'publisher']);

const blankPage = 'about:blank';

/**
 * Settings applied to / set by the functions pages. Not all settings are used by every page
 */
class Settings {
    allowEncryptedMedia;
    enableSameOrigin;
    initialVolume;
    initialSpeed;

    /**
     * @param {{value: boolean, show: boolean}?} allowEncryptedMedia
     * @param {{value: boolean, show: boolean}?} enableSameOrigin
     * @param {{value: number, show: boolean}?} initialVolume
     * @param {{value: number, show: boolean}?} initialSpeed
     */
    constructor(allowEncryptedMedia, enableSameOrigin, initialVolume, initialSpeed) {
        this.allowEncryptedMedia = allowEncryptedMedia ?? { value: false, show: true };
        this.enableSameOrigin = enableSameOrigin ?? { value: false, show: true };
        this.initialVolume = initialVolume ?? { value: 1, show: false };
        this.initialSpeed = initialSpeed ?? { value: 1, show: false };
    }

    freezeSelf() {
        Object.freeze(this.allowEncryptedMedia);
        Object.freeze(this.enableSameOrigin);
        Object.freeze(this.initialVolume);
        Object.freeze(this.initialSpeed);
        return Object.freeze(this);
    }

    /**
     * @returns The defaults are immutable. A mutable copy is created so that it can
     * be modified by the UI
     */
    newCopy() {
        return new Settings({ ...this.allowEncryptedMedia },
            { ...this.enableSameOrigin },
            { ...this.initialVolume },
            { ...this.initialSpeed });
    }

    static ytDefault = new Settings(
        { value: true, show: false },
        { value: true, show: false },
        { value: 10, show: true },
        { value: 2, show: true },
    );
    static ttvDefault = new Settings(
        { value: true, show: false },
        { value: true, show: false },
        { value: 10, show: true },
        { value: 1, show: false },
    );
    static othersDefault = new Settings(
        { value: false, show: true },
        { value: true, show: true },
    );
    static safeDefault = new Settings();
}

/**
 * Definition of one possible function which the user can choose. Deeply immutable
 */
class Action {
    //static #urlPrefix = 'https://ultramarineblue.gitlab.io/useless-pages/';
    static #urlPrefix = 'http://localhost:8000/public/';
    static #ytPage = 'yt.html';
    static #ttvPage = 'ttv.html';
    static #testPage = 'test.html';

    id;
    name;
    placeholder;
    #functionPage;
    #queryToCommand;
    #defaultSettings;

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} placeholder
     * @param {string} functionPage
     * @param {(queryText: string, settings: Settings) => [number, string]} queryToCommand
     * @param {Settings} defaultSettings
     */
    constructor(id, name, placeholder, functionPage, queryToCommand, defaultSettings) {
        this.id = Object.freeze(id);
        this.name = Object.freeze(name);
        this.placeholder = Object.freeze(placeholder);
        this.#functionPage = Object.freeze(functionPage);
        this.#queryToCommand = Object.freeze(queryToCommand);
        this.#defaultSettings = defaultSettings.freezeSelf();

        Object.freeze(this);
    }

    /**
     * Think of this as some form of IPC: the embedded pages are functions and their calling
     * parameters are encoded as JSON array in the hash of the URL
     * @param {string?} queryText
     * @param {Settings} settings
     * @returns {string}
     */
    getEmbedUrl(queryText, settings) {
        try {
            const command = this.#queryToCommand(queryText?.normalize()?.trim() ?? '', settings);
            const hash = encodeURIComponent(JSON.stringify(command));
            return Action.#urlPrefix + this.#functionPage + '#' + hash;
        } catch (e) {
            alert(e);
            console.error(e);
            return blankPage;
        }
    }

    /**
     * @returns Mutable copy of defaults
     */
    getDefaults() {
        return this.#defaultSettings.newCopy();
    }

    static actions = Object.freeze([
        new Action(
            'ytVideo',
            'YouTube Video',
            'Video URL',
            Action.#ytPage,
            (queryText, settings) => {
                const volume = settings.initialVolume.value;
                const speed = settings.initialSpeed.value;
                const url = new URL(queryText);
                let videoId;
                if (url.hostname.toLowerCase().endsWith('youtu.be')) {
                    // url format: https://youtu.be/{video id}
                    const pathArray = url.pathname.split("/");
                    videoId = pathArray[1];
                } else {
                    // url format: https://www.youtube.com/watch?v={video id}
                    videoId = url.searchParams.get('v');
                }
                return [0, videoId, volume, speed];
            },
            Settings.ytDefault
        ),
        new Action(
            'ytPlaylist',
            'YouTube Playlist',
            'Playlist URL',
            Action.#ytPage,
            (queryText, settings) => {
                const volume = settings.initialVolume.value;
                const speed = settings.initialSpeed.value;
                // url format: https://www.youtube.com/playlist?list={long string}
                const url = new URL(queryText);
                return [1, url.searchParams.get('list'), volume, speed];
            },
            Settings.ytDefault
        ),
        new Action(
            'embedPage',
            'Embed webpage',
            'URL',
            Action.#testPage,
            (queryText) => {
                return [0, queryText];
            },
            Settings.othersDefault
        ),
        new Action(
            'runScript',
            'Run JS in iframe',
            'JavaScript',
            Action.#testPage,
            (queryText) => {
                return [1, queryText];
            },
            Settings.safeDefault
        ),
        new Action(
            'showHtml',
            'Render HTML fragment',
            'HTML',
            Action.#testPage,
            (queryText) => {
                return [2, queryText];
            },
            Settings.safeDefault
        ),
        new Action(
            'ttvChannel',
            'Twitch Channel',
            'Channel name',
            Action.#ttvPage,
            (queryText, settings) => {
                const volume = settings.initialVolume.value / 100;
                return [0, queryText, volume];
            },
            Settings.ttvDefault
        ),
        new Action(
            'ttvVod',
            'Twitch VOD',
            'VOD URL',
            Action.#ttvPage,
            (queryText, settings) => {
                const volume = settings.initialVolume.value / 100;
                // url format: https://www.twitch.tv/videos/{a large number}
                const url = new URL(queryText);
                const pathArray = url.pathname.split("/");
                let lastPath = pathArray[pathArray.length - 1];
                if (!lastPath.startsWith('v')) {
                    lastPath = 'v' + lastPath;
                }
                return [1, lastPath, volume];
            },
            Settings.ttvDefault
        ),
        new Action(
            'gmaps',
            'Google Maps',
            'Search location',
            Action.#testPage,
            (queryText) => {
                return [0, `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(queryText)}&t=m&z=12&ie=UTF8&iwloc=B&output=embed`];
            },
            Settings.othersDefault
        ),
    ]);
}

/**
 * Some sites, like Youtube and Twitch, offer convenient scripts to embed their content into any other page. These scripts even offer some
 * control over the embedded content. Unfortunately, this means that you have to execute untrustworthy, third party scripts in the browsing
 * context of your page. These scripts can therefore see the same data as your own scripts and freely use the information found on the
 * page. At best, these third party scripts will use the data to track the users of the page. Less scrupulous platforms could share / sell
 * personally identifiable information found on the page to ad agencies or other organizations, affecting user's privacy and in worst case
 * their safety.
 *
 * For HTML and CSS, ShadowDOM offer a way to isolate elements on the same page from each other. However no such tool exist for JavaScript,
 * all scripts, including those in a custom element, runs in the global scope of a browsing context. To isolate scripts from each other
 * and prevent untrustworthy scripts from accessing the page with personally identifiable information, you have to create a new, isolated
 * browsing context using a sandboxed iframe. An iframe with sandbox="allow-scripts" is considered to be from a opaque and unique origin.
 * Therefore it is treated as cross-origin to any other sites, including itself (the actual src). Unfortunately, YouTube and Twitch
 * embeds require both allow-scripts and allow-same-origin to work.
 *
 * If you want to enforce the sandbox rules and make sure that there is no way that third party scripts can somehow remove the sandbox or
 * rewrite the feature policy, you need to run their script in a iframe which is served from a different domain than the embedding page.
 * (srcdoc is useless here, since with both allow-scripts and allow-same-origin the document is considered to be from the same origin as
 * the parent document.) This way their script can't access the embedding element via window.parent.document.querySelectorAll('iframe').
 *
 * So: Top level page -> iframe from a different domain, in which third party scripts are used -> iframe with the actual (video or other
 * types of) content
 *
 * This is not good: iframe-ception, slower loading time, more complex code and deployment... But I can't think of a better way to do it
 *
 * Sadly, on both Safari and Chromium-based browsers, a nested iframe can get the origin of every parent browsing contexts using
 * location.ancestorOrigins. All this effort and some limited form of tracking is still possible. At least it's only the origin of the
 * top level page, not the full URL or other data on that page.
 *
 * Both YouTube and Twitch embedding script sends the full URL of the page where their script is included and executed to their server.
 * Besides the fact that this alone can leak PII to Google / Amazon, if there are any PII in the full URL, I do wonder just how much of
 * the deep web Google can detect and track. (Google Tag Manager, YouTube's script and possibly even Google Maps embedding script)
 */
class EmbedPage {
    static #actionsMap = new Map(
        Action.actions.map(elem => [elem.id, elem])
    );
    static #multiLineInputActionIds = new Set(['runScript', 'showHtml']);

    actions = Action.actions;
    showIframe = false;
    showDialog = true;
    showTextArea = false;

    sandboxAttr = '';
    allowAttr = '';
    srcAttr = blankPage;
    queryText = '';

    selectedActionId = Action.actions[0].id;
    settings = Action.actions[0].getDefaults();

    async loadIframe() {
        const selectedAction = EmbedPage.#actionsMap.get(this.selectedActionId);
        const embedUrl = selectedAction?.getEmbedUrl(this.queryText, this.settings) ?? blankPage;

        this.showIframe = false;
        await this.$nextTick();

        this.setAllow();
        this.setSandbox();
        this.srcAttr = blankPage;
        this.showIframe = true;
        // Allow and sandbox attribute only apply if they are present before loading the iframe. Depending on how alpine.js
        // sets the attributes, the navigation may start before the other attributes are set. => Delay setting src to make
        // sure the other attributes are present before navigation
        await this.$nextTick();
        this.srcAttr = embedUrl;
    }

    setAllow() {
        this.allowAttr = "accelerometer 'none'; ambient-light-sensor 'none'; attribution-reporting 'none'; autoplay 'none'; bluetooth 'none'; browsing-topics 'none'; camera 'none'; compute-pressure 'none'; cross-origin-isolated 'none'; display-capture 'none'; document-domain 'none'; fullscreen 'none'; gamepad 'none'; geolocation 'none'; gyroscope 'none'; hid 'none'; identity-credentials-get 'none'; idle-detection 'none'; local-fonts 'none'; magnetometer 'none'; microphone 'none'; midi 'none'; otp-credentials 'none'; payment 'none'; picture-in-picture 'none'; publickey-credentials-create 'none'; publickey-credentials-get 'none'; screen-wake-lock 'none'; serial 'none'; speaker-selection 'none'; storage-access 'none'; usb 'none'; web-share 'none'; window-management 'none'; xr-spatial-tracking 'none'; ";
        if (this.settings.allowEncryptedMedia.value) {
            this.allowAttr = this.allowAttr.concat(" encrypted-media * ;");
        } else {
            this.allowAttr = this.allowAttr.concat(" encrypted-media 'none';");
        }
    }

    setSandbox() {
        this.sandboxAttr = 'allow-scripts ';
        if (this.settings.enableSameOrigin.value) {
            this.sandboxAttr = this.sandboxAttr.concat('allow-same-origin ');
        }
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.body.requestFullscreen();
        }
    }

    getPlaceholder() {
        return EmbedPage.#actionsMap.get(this.selectedActionId).placeholder;
    }

    actionSelectionChanged() {
        this.settings = EmbedPage.#actionsMap.get(this.selectedActionId).getDefaults();
        this.showTextArea = EmbedPage.#multiLineInputActionIds.has(this.selectedActionId);
    }
}

document.addEventListener('alpine:init', () => {
    Alpine.data('embed', () => new EmbedPage());
});
