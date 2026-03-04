---
title: "Selective Trails using createGraphics"
layout: ../../../../layouts/BaseLayout.astro
---

Link: https://www.openprocessing.org/sketch/1031301

Creating trails, by drawing on top of what's already on the canvas instead of clearing it (via `background()`), is a popular technique. But what about when you want one shape to leave a trail, but another shape to draw at a new position (or size, or orientation) each time, without leaving a trace of its previous state? [Here's](https://www.openprocessing.org/sketch/1031301) a solution that uses `createGraphics()`.
