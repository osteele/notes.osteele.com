---
title: "Animated GIFs"
layout: ../../../../layouts/BaseLayout.astro
---

Creating animated GIFs from p5.js sketches using the gif.js library.

## Setup

Include the gif.js library in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/gif.js/dist/gif.js"></script>
```

## Code Example

```javascript
let gif;
let recording = false;
let frameCount = 0;
const totalFrames = 60;

function setup() {
  createCanvas(400, 400);

  gif = new GIF({
    workers: 2,
    quality: 10,
    width: width,
    height: height
  });

  gif.on('finished', function(blob) {
    window.open(URL.createObjectURL(blob));
  });
}

function draw() {
  background(220);
  // Your animation code here
  ellipse(width/2 + sin(frameCount * 0.1) * 100, height/2, 50, 50);

  if (recording) {
    gif.addFrame(canvas, {delay: 1000/30, copy: true});
    frameCount++;
    if (frameCount >= totalFrames) {
      gif.render();
      recording = false;
    }
  }
}

function keyPressed() {
  if (key === 'r') {
    recording = true;
    frameCount = 0;
  }
}
```

Press 'r' to start recording. The GIF will open in a new window when complete.

## Related

<ul class="page-list"><li><a href="/p5js/examples/slicing/">Slicing</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
