---
title: "Change Background Color Based on Mouse Position"
layout: ../../../../../layouts/BaseLayout.astro
---

Use conditionals to change the background color depending on where the mouse is located.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  if (mouseX < width / 2) {
    background(255, 100, 100); // Red on left side
  } else {
    background(100, 100, 255); // Blue on right side
  }

  // Draw a dividing line
  stroke(255);
  line(width / 2, 0, width / 2, height);
}
```

The background changes color as the mouse moves from one side of the canvas to the other.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/checkmouseposition/">Check Mouse Position</a></li><li><a href="/courses/creative-coding/cclab-example-codes/checkmousex/">Check Mouse X</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
