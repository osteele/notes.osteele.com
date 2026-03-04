---
title: "Selective Trails using createGraphics"
layout: ../../../../layouts/BaseLayout.astro
---

Create trail effects for some objects while others remain static using an off-screen graphics buffer.

```javascript
let trailLayer;

function setup() {
  createCanvas(400, 400);
  trailLayer = createGraphics(width, height);
  trailLayer.background(220);
}

function draw() {
  // Fade the trail layer slightly
  trailLayer.fill(220, 10);
  trailLayer.noStroke();
  trailLayer.rect(0, 0, width, height);

  // Draw trailing object on the buffer
  trailLayer.fill(255, 0, 0);
  trailLayer.noStroke();
  trailLayer.ellipse(mouseX, mouseY, 30, 30);

  // Draw the trail layer to the main canvas
  image(trailLayer, 0, 0);

  // Draw non-trailing objects directly on main canvas
  fill(0, 0, 255);
  ellipse(width/2, height/2, 50, 50);
}
```

The red circle leaves trails while the blue circle stays crisp.

## Related

<ul class="page-list"><li><a href="/p5js/examples/selective-trails-with-arrays/">Selective Trails with Arrays</a></li><li><a href="/p5js/tutorials/selective-trails-2-creategraphics/">Tutorial: Selective Trails 2</a></li><li><a href="/p5js/examples/">All Examples</a></li></ul>
