---
title: "Check Mouse X"
layout: ../../../../../layouts/BaseLayout.astro
---

Use the `mouseX` variable to check the horizontal position of the mouse.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  if (mouseX < 100) {
    fill(255, 0, 0);
    text("Left zone", 20, 200);
  } else if (mouseX < 200) {
    fill(255, 165, 0);
    text("Left-center zone", 120, 200);
  } else if (mouseX < 300) {
    fill(0, 255, 0);
    text("Right-center zone", 220, 200);
  } else {
    fill(0, 0, 255);
    text("Right zone", 320, 200);
  }

  // Draw zone boundaries
  stroke(100);
  line(100, 0, 100, height);
  line(200, 0, 200, height);
  line(300, 0, 300, height);
}
```

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/checkmouseposition/">Check Mouse Position</a></li><li><a href="/courses/creative-coding/cclab-example-codes/checkoutofcanvas/">Check Out of Canvas</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
