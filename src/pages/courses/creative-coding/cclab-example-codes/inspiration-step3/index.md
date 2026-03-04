---
title: "Inspiration Step 3"
layout: ../../../../../layouts/BaseLayout.astro
---

Adding animation and interactivity.

```javascript
function setup() {
  createCanvas(400, 400);
  colorMode(HSB);
}

function draw() {
  background(240);

  noStroke();
  // Animate based on frameCount and mouse position
  for (let i = 0; i < 10; i++) {
    let size = 200 - i * 18;
    let hue = (frameCount + i * 20) % 360;
    let offset = sin(frameCount * 0.05 + i * 0.5) * 20;

    fill(hue, 80, 90, 0.7);
    ellipse(mouseX + offset, mouseY + offset, size, size);
  }
}
```

Animation with `frameCount` and `sin()` brings the design to life.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/inspiration-step2/">Inspiration Step 2</a></li><li><a href="/courses/creative-coding/cclab-example-codes/poem-example/">Poem Example</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
