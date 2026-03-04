---
title: "Check Out of Canvas"
layout: ../../../../../layouts/BaseLayout.astro
---

Detect when the mouse leaves the canvas area.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  // Check if mouse is outside canvas
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
    background(255, 100, 100); // Red when outside
    fill(255);
    text("Mouse is outside canvas!", width / 2 - 80, height / 2);
  } else {
    background(100, 255, 100); // Green when inside
    fill(0);
    text("Mouse is inside canvas", width / 2 - 70, height / 2);
    ellipse(mouseX, mouseY, 20, 20);
  }
}
```

This technique is useful for pausing interactions when the user moves the mouse away.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/checkmousex/">Check Mouse X</a></li><li><a href="/courses/creative-coding/cclab-example-codes/checkmouseposition/">Check Mouse Position</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
