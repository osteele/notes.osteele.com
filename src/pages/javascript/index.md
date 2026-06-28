---
title: "JavaScript Resources"
layout: ../../layouts/BaseLayout.astro
---

# Pages

[JavaScript Arrays](/javascript/arrays/) · [Iteration Methods](/javascript/iteration-methods/) · [p5.js Resources](/p5js/) · [Visual Studio Code for p5.js](/vscode/) · [PoseNet](/posenet/)

# Tutorials and Examples

- [JavaScript Crash Course](https://paper.dropbox.com/doc/JavaScript-Crash-Course--ApRkMF3FH~pDlkHv5aP6oi~aAg-IYQ3f4icQsFSi6YrY7IAN)
- p5.js [Learn](https://p5js.org/learn/), [Examples](https://p5js.org/examples/)
- [Annotated p5.js + PoseNet project](https://github.com/osteele/p5pose/blob/master/src/sketch.js). (Note that this uses the `p5.` prefix. Code created from the more recent template doesn't need this.)

# JavaScript Reference Documentation

- [JavaScript Array Methods – (MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#Instance_methods), [W3Schools](https://www.w3schools.com/js/js_array_methods.asp))
- [JavaScript String Methods — (MDN,](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#Methods) [W3Schools](https://www.w3schools.com/js/js_string_methods.asp))

# P5 Reference Documentation

- p5.js [Reference](https://p5js.org/reference/)
- [p5.js cheat sheet](https://bmoren.github.io/p5js-cheat-sheet/)

# PoseNet Documentation

- PoseNet [ml5.js documentation](https://learn.ml5js.org/docs/#/reference/posenet)
- [PoseNet reference documentation](https://github.com/tensorflow/tfjs-models/tree/master/posenet#pose-detection-in-the-browser-posenet-model)

# Recipes

- [Rotate around a point](https://editor.p5js.org/osteele/sketches/bd7mPSLKE).  This p5.js sketch includes a function rotateAbout that rotates a shape around a specific point, instead of around the origin (upper left corner). In the sketch, it’s used to rotate the rectangle around its center.
- [Calibrate a sensor reading](https://editor.p5js.org/osteele/sketches/gxtbqdo56). Here’s an example of how to calibrate a sensor. In the sketch, the mouse X position is used to stand in for the first (yaw) euler angle, so that the code can run without a physical IMU. When you click, the program interprets this as “the physical device is now in its start position. Whatever angle the sensor returns should now be treated as the start position, even if the actual sensor number is different”. It does this by recording the current sensor angle, and subtracting it from the sensor angles. This is similar to the calibration process that you’ve seen for the Optitrack and other devices, where the performer assumes a known position and the device operator tells the computer “this is the known start position”.
