---
title: "Use Environment Variables: width and height"
layout: ../../../../../layouts/BaseLayout.astro
---

p5.js provides built-in variables `width` and `height` that contain the canvas dimensions.

```javascript
function setup() {
  createCanvas(400, 300);
}

function draw() {
  background(220);

  // Center of canvas
  ellipse(width / 2, height / 2, 100, 100);

  // Corners
  ellipse(0, 0, 50, 50);
  ellipse(width, 0, 50, 50);
  ellipse(0, height, 50, 50);
  ellipse(width, height, 50, 50);
}
```

Using `width` and `height` makes your sketch adapt to different canvas sizes without changing coordinates.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/align-multiple-shapes-with-a-variable/">Align Multiple Shapes with a Variable</a></li><li><a href="/courses/creative-coding/cclab-example-codes/place-two-ellipses-at-the-same-positions-by-re-using-variables/">Re-using Position Variables</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
