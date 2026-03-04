---
title: "Visual Studio Code for P5.js"
layout: ../../layouts/BaseLayout.astro
---

Setting up Visual Studio Code for p5.js development.

## Recommended Extensions

-   **Live Server** - Launch a local development server with live reload
-   **p5.vscode** - p5.js snippets and autocomplete
-   **Prettier** - Code formatter

## Project Setup

A minimal p5.js project needs:

-   `index.html` - HTML file that loads p5.js and your sketch
-   `sketch.js` - Your p5.js code

### index.html

<div class="code-example"><pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
  &lt;script src="https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js"&gt;&lt;/script&gt;
  &lt;script src="sketch.js"&gt;&lt;/script&gt;
&lt;/head&gt;
&lt;body&gt;
&lt;/body&gt;
&lt;/html&gt;</code></pre></div>

### sketch.js

<div class="code-example"><pre><code>function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  circle(200, 200, 100);
}</code></pre></div>

## Related

<ul class="page-list"><li><a href="/p5js/">p5.js Resources</a></li><li><a href="/creative-coding/">Creative Coding</a></li></ul>
