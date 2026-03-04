---
title: "Check Mouse Position"
layout: ../../../../../layouts/BaseLayout.astro
---

Detect which quadrant of the canvas the mouse is in using conditionals.

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Check quadrant
  if (mouseX < width / 2 && mouseY < height / 2) {
    fill(255, 0, 0);
    rect(0, 0, width / 2, height / 2); // Top-left
  } else if (mouseX >= width / 2 && mouseY < height / 2) {
    fill(0, 255, 0);
    rect(width / 2, 0, width / 2, height / 2); // Top-right
  } else if (mouseX < width / 2 && mouseY >= height / 2) {
    fill(0, 0, 255);
    rect(0, height / 2, width / 2, height / 2); // Bottom-left
  } else {
    fill(255, 255, 0);
    rect(width / 2, height / 2, width / 2, height / 2); // Bottom-right
  }
}
```

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/checkmousex/">Check Mouse X</a></li><li><a href="/courses/creative-coding/cclab-example-codes/change-the-background-color-based-on-the-mouse-position/">Change Background Color</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
