---
title: "Array 2"
layout: ../../../../../layouts/BaseLayout.astro
---

Using a for loop to iterate through an array.

```javascript
let xPositions = [50, 100, 150, 200, 250];

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Use a for loop to draw all circles
  for (let i = 0; i < xPositions.length; i++) {
    ellipse(xPositions[i], 200, 40, 40);
  }
}
```

The `.length` property tells us how many elements are in the array.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/array1/">Array 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array3/">Array 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
