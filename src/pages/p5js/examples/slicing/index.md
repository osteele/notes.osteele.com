---
title: "Slicing"
layout: ../../../../layouts/BaseLayout.astro
---

Creating slit-scan and slice effects by copying thin strips of pixels.

```javascript
let capture;
let sliceBuffer;

function setup() {
  createCanvas(640, 480);
  capture = createCapture(VIDEO);
  capture.hide();
  sliceBuffer = createGraphics(width, height);
}

function draw() {
  // Copy a single column from the video to the buffer
  let slice = capture.get(capture.width/2, 0, 1, capture.height);

  // Shift existing content left
  sliceBuffer.copy(sliceBuffer, 1, 0, width-1, height, 0, 0, width-1, height);

  // Draw new slice on the right
  sliceBuffer.image(slice, width-1, 0, 1, height);

  // Display the result
  image(sliceBuffer, 0, 0);
}
```

This creates a classic slit-scan effect by continuously sampling a single column from the video.

## Variations

-   Sample from different positions based on time
-   Use horizontal slices instead of vertical
-   Apply to images instead of video

## Related

<ul class="page-list"><li><a href="/p5js/tutorials/slice-effect/">Tutorial: Slice Effect</a></li><li><a href="/p5js/examples/animated-gifs/">Animated GIFs</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
