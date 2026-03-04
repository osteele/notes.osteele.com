---
title: "Place Two Ellipses at the Same Positions"
layout: ../../../../../layouts/BaseLayout.astro
---

Re-using position variables ensures that multiple shapes share the exact same coordinates.

```javascript
let x = 200;
let y = 200;

function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);

  // Outer ellipse (larger)
  fill(100, 150, 255);
  ellipse(x, y, 150, 150);

  // Inner ellipse (smaller, same position)
  fill(255, 200, 100);
  ellipse(x, y, 80, 80);
}
```

Both ellipses are centered at `(x, y)`. Changing these variables moves both shapes together.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/align-multiple-shapes-with-a-variable/">Align Multiple Shapes with a Variable</a></li><li><a href="/courses/creative-coding/cclab-example-codes/use-environment-variables-width-and-height/">Use Environment Variables: width and height</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
