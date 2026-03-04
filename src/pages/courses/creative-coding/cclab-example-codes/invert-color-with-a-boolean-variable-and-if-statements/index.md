---
title: "Invert Color with Boolean and If Statements"
layout: ../../../../../layouts/BaseLayout.astro
---

Use a boolean variable to toggle between two color states.

```javascript
let inverted = false;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  if (inverted) {
    background(0);
    fill(255);
  } else {
    background(255);
    fill(0);
  }

  ellipse(width / 2, height / 2, 150, 150);
  text("Click to toggle", width / 2 - 45, height - 30);
}

function mousePressed() {
  inverted = !inverted; // Toggle the boolean
}
```

Clicking toggles the `inverted` variable between `true` and `false`.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/develop-a-color-palette-with-variables/">Develop a Color Palette</a></li><li><a href="/courses/creative-coding/cclab-example-codes/use-a-variable-and-if-statements-to-select-a-shape/">Select a Shape with Variables</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
