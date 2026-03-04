---
title: "Use a Variable and If Statements to Select a Shape"
layout: ../../../../../layouts/BaseLayout.astro
---

Use a numeric variable to switch between different shapes.

```javascript
let shapeType = 0;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  fill(100, 150, 255);

  if (shapeType === 0) {
    ellipse(width / 2, height / 2, 150, 150);
  } else if (shapeType === 1) {
    rect(width / 2 - 75, height / 2 - 75, 150, 150);
  } else if (shapeType === 2) {
    triangle(width / 2, height / 2 - 75,
             width / 2 - 75, height / 2 + 75,
             width / 2 + 75, height / 2 + 75);
  }

  fill(0);
  text("Press 1, 2, or 3 to change shape", 100, 50);
}

function keyPressed() {
  if (key === '1') shapeType = 0;
  if (key === '2') shapeType = 1;
  if (key === '3') shapeType = 2;
}
```

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/invert-color-with-a-boolean-variable-and-if-statements/">Invert Color with Boolean</a></li><li><a href="/courses/creative-coding/cclab-example-codes/checkmouseposition/">Check Mouse Position</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
