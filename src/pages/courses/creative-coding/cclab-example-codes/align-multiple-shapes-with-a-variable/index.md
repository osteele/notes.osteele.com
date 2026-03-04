---
title: "Align Multiple Shapes with a Variable"
layout: ../../../../../layouts/BaseLayout.astro
---

Using a single variable to align multiple shapes makes it easy to move them all at once.

```javascript
let centerX = 200;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // All shapes use the same x position
  ellipse(centerX, 100, 50, 50);
  rect(centerX - 25, 175, 50, 50);
  triangle(centerX, 275, centerX - 25, 325, centerX + 25, 325);
}
```

By changing the value of `centerX`, all three shapes move together horizontally.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/develop-a-color-palette-with-variables/">Develop a Color Palette with Variables</a></li><li><a href="/courses/creative-coding/cclab-example-codes/use-environment-variables-width-and-height/">Use Environment Variables: width and height</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
