---
title: "Poem Example"
layout: ../../../../../layouts/BaseLayout.astro
---

Using text and arrays to display poetry with animation.

```javascript
let lines = [
  "The fog comes",
  "on little cat feet.",
  "",
  "It sits looking",
  "over harbor and city",
  "on silent haunches",
  "and then moves on."
];

let currentLine = 0;

function setup() {
  createCanvas(400, 400);
  textAlign(CENTER, CENTER);
  textSize(20);
}

function draw() {
  background(30);
  fill(255);

  // Display lines up to current line
  for (let i = 0; i <= currentLine; i++) {
    text(lines[i], width / 2, 80 + i * 40);
  }
}

function mousePressed() {
  if (currentLine < lines.length - 1) {
    currentLine++;
  }
}
```

Click to reveal each line of the poem. Based on "Fog" by Carl Sandburg.

## Related

<ul class="page-list"><li><a href="/courses/creative-coding/cclab-example-codes/inspiration-step3/">Inspiration Step 3</a></li><li><a href="/courses/creative-coding/cclab-example-codes/array1/">Array 1</a></li><li><a href="/courses/creative-coding/cclab-example-codes/">All Example Codes</a></li></ul>
