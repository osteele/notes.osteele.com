---
title: "Rotate about a point"
layout: ../../../../layouts/BaseLayout.astro
---

Almost everyone ends up wanting a function to rotate around a point. ([rotate()](https://p5js.org/reference/#/p5/rotate) rotates around the origin.) Stick this function in your sketch, and then you can use it as though it were built into p5.js.

```jsx
function rotateAbout(angle, x, y) {
   translate(x, y);
   rotate(angle);
   translate(-x, -y);
 }
```
