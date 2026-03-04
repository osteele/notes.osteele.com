---
title: "Develop a Color Palette with Variables"
layout: ../../../../../layouts/BaseLayout.astro
---

Store colors in variables to create a consistent color palette across your sketch.

```javascript
// Define color palette
let primaryColor;
let secondaryColor;
let accentColor;

function setup() {
  createCanvas(400, 400);
  primaryColor = color(65, 105, 225);    // Royal Blue
  secondaryColor = color(255, 182, 193); // Light Pink
  accentColor = color(255, 215, 0);      // Gold
}

function draw() {
  background(240);

  fill(primaryColor);
  rect(50, 100, 100, 200);

  fill(secondaryColor);
  rect(150, 100, 100, 200);

  fill(accentColor);
  rect(250, 100, 100, 200);
}
```

Using variables for colors makes it easy to update your color scheme by changing values in one place.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/align-multiple-shapes-with-a-variable/">Align Multiple Shapes with a Variable</a></li><li><a href="/courses/creative-coding/cclab-example-codes/invert-color-with-a-boolean-variable-and-if-statements/">Invert Color with Boolean</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
