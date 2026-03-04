---
title: "Selective Trails with Arrays"
layout: ../../../../layouts/BaseLayout.astro
---

Link: https://openprocessing.org/sketch/1031294

Creating trails, by drawing on top of what's already on the canvas instead of clearing it (via `background()`), is a popular technique. But what about when you want one shape to leave a trail, but another shape to draw at a new position (or size, or orientation) each time, without leaving a trace of its previous state? [Here's a solution](https://www.openprocessing.org/sketch/1031301) that uses Arrays.
