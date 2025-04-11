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

const blankPage = 'about:blank';

class Action {
    static #urlPrefix = 'https://ultramarineblue.gitlab.io/useless-pages/';
    //static #urlPrefix = 'http://localhost:8000/public/';
    id;
    name;
    placeholder;
    #functionPage;
    #queryToCommand;
    #defaultSettings;
    #showInputs;

    /**
     * @param {string} id
     * @param {string} name
     * @param {string} placeholder
     * @param {string} functionPage
     * @param {(queryText: string) => [number, string]} queryToCommand
     * @param {{allowEncryptedMedia, enableSameOrigin, initialVolume, initialSpeed}} defaultSettings
     * @param {string[]} showInputs
     */
    constructor(id, name, placeholder, functionPage, queryToCommand, defaultSettings, showInputs) {
        this.id = Object.freeze(id);
        this.name = Object.freeze(name);
        this.placeholder = Object.freeze(placeholder);
        this.#functionPage = Object.freeze(functionPage);
        this.#queryToCommand = Object.freeze(queryToCommand);
        this.#defaultSettings = Object.freeze(defaultSettings);
        this.#showInputs = Object.freeze(showInputs);

        Object.freeze(this);
    }

    /**
     * Think of this as some form of IPC: the embedded pages are functions and their calling
     * parameters are encoded as JSON array in the hash of the URL
     * @param {string?} queryText
     * @returns {string}
     */
    getEmbedUrl(queryText) {
        try {
            const command = this.#queryToCommand(queryText?.normalize()?.trim() ?? '');
            const hash = encodeURIComponent(JSON.stringify(command));
            return Action.#urlPrefix + this.#functionPage + '#' + hash;
        } catch (e) {
            alert(e);
            console.error(e);
            return blankPage;
        }
    }

    /**
     * @returns Copy of defaults
     */
    getDefaults() {
        return { ...this.#defaultSettings };
    }

    /**
     * @returns Copy of array
     */
    getShowInputs() {
        return [...this.#showInputs];
    }

    static actions = Object.freeze([
        new Action(
            'ytVideo',
            'YouTube Video',
            'Video URL',
            'yt.html',
            (queryText) => {
                const url = new URL(queryText);
                if (url.hostname.toLowerCase().endsWith('youtu.be')) {
                    // url format: https://youtu.be/{video id}
                    const pathArray = url.pathname.split("/");
                    return [0, pathArray[1]];
                } else {
                    // url format: https://www.youtube.com/watch?v={video id}
                    return [0, url.searchParams.get('v')];
                }
            },
        ),
        new Action(
            'ytPlaylist',
            'YouTube Playlist',
            'Playlist URL',
            'yt.html',
            (queryText) => {
                // url format: https://www.youtube.com/playlist?list={long string}
                const url = new URL(queryText);
                return [1, url.searchParams.get('list')];
            },
        ),
        new Action(
            'embedPage',
            'Embed webpage',
            'URL',
            'test.html',
            (queryText) => {
                return [0, queryText];
            },
        ),
        new Action(
            'runScript',
            'Run JS in iframe',
            'JavaScript',
            'test.html',
            (queryText) => {
                return [1, queryText];
            },
        ),
        new Action(
            'ttvChannel',
            'Twitch Channel',
            'Channel name',
            'ttv.html',
            (queryText) => {
                return [0, queryText];
            },
        ),
        new Action(
            'ttvVod',
            'Twitch VOD',
            'VOD URL',
            'ttv.html',
            (queryText) => {
                // url format: https://www.twitch.tv/videos/{a large number}
                const url = new URL(queryText);
                const pathArray = url.pathname.split("/");
                let lastPath = pathArray[pathArray.length - 1];
                if (!lastPath.startsWith('v')) {
                    lastPath = 'v' + lastPath;
                }
                return [1, lastPath];
            },
        ),
        new Action(
            'gmaps',
            'Google Maps',
            'Search location',
            'test.html',
            (queryText) => {
                return [0, `https://maps.google.com/maps?hl=en&q=${encodeURIComponent(queryText)}&t=m&z=12&ie=UTF8&iwloc=B&output=embed`];
            },
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
 * So: Top level page -> iframe from a different domain, in which Youtube / Twitch script is used -> iframe from Youtube / Twitch with the
 * actual video content
 *
 * This is not good: iframe-ception, slower loading time, more complex code and deployment
 * But I can't think of a better way to do it
 */
class EmbedPage {
    static #actionsMap = new Map(
        Action.actions.map(elem => [elem.id, elem])
    );

    actions = Action.actions;

    showIframe = false;
    showDialog = true;
    sandboxAttr = '';
    allowAttr = '';
    srcAttr = blankPage;
    selectedActionId = Action.actions[0].id;
    queryText = '';

    allowEncryptedMedia = false;
    enableSameOrigin = true;

    constructor() { }

    async loadIframe() {
        const selectedAction = EmbedPage.#actionsMap.get(this.selectedActionId);
        const embedUrl = selectedAction?.getEmbedUrl(this.queryText) ?? blankPage;

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
        if (this.allowEncryptedMedia) {
            this.allowAttr = this.allowAttr.concat(" encrypted-media * ;");
        } else {
            this.allowAttr = this.allowAttr.concat(" encrypted-media 'none';");
        }
    }

    setSandbox() {
        this.sandboxAttr = 'allow-scripts ';
        if (this.enableSameOrigin) {
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
}

document.addEventListener('alpine:init', () => {
    Alpine.data('embed', () => new EmbedPage());
});
