---
title: "PoseNet"
layout: ../../layouts/BaseLayout.astro
---

[PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) estimates poses (joint positions of a human figure) from a webcam (or other image data). It runs in a web page, and can be used with p5.js, or other JavaScript programs.

# References

[ml5.js PoseNet API](https://learn.ml5js.org/#/reference/posenet) – if you are using PoseNet within p5.js

[TensorFlow PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) – if you are using PoseNet from JavaScript, within the browser. The ml5.js PoseNet API uses library, and this page contains additional documentation beyond the ml5.js documentation – for example, the list of body parts.

# Starter Templates

Use these to get started:

- OpenProcessing.org: Start with [this template](https://openprocessing.org/sketch/1073957). Click the code icon (`</>`) to start editing. Remember to Save your work! This will ask you to create a (free) account on OpenProcessing.org if you do not already have one.
- Glitch: Remix [this template](https://glitch.com/edit/#!/cclab-p5js-template?path=README.md%3A1%3A0).
- Local development (Atom or Visual Studio Code): [p5pose](https://github.com/osteele/p5pose) is a p5.js + [ml5.js PoseNet](https://learn.ml5js.org/#/reference/posenet) starter. I prefer it to the official starter code, because it uses the [for…of statement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of) to avoid those pesky nested iteration indices.

# Selecting the Camera

If you have more than one camera, the system may select the wrong one. (This can happen if you have installed a virtual camera, such as Snap Camera or OBS Link.) In Chrome, follow these instructions to fix this:

1. Select File > Preferences
2. In the “Privacy and security” section of the Settings page, click “Site Settings”
3. In the “Permissions” section of the page, click Camera
4. At the top of the page, there is a popup menu that lists the available cameras. Select the correct camera. (For example, on a Macintosh this is FaceTime HD Camera (Built-in).

# Oliver' Tools

Here are some things I've created for use with PoseNet:

- [p5pose-recorder](https://github.com/osteele/p5pose-recorder) ([online version](https://osteele.github.io/p5pose-recorder/)) records PoseNet data into a JSON file (or set of files). Before saving the file, the user can use a built-in timeline editor to trim the beginning and end, which tend to includes poses from when the user backed up from the webcam after starting the program, and from when they approached the webcam again after creating the pose.
- [p5pose-playback](https://github.com/osteele/p5pose-playback) ([online demo](https://osteele.github.io/p5pose-playback/)) adds a menu to (my version of) the ml5.js PoseNet starter. Use the menu to switch between the webcam, and PoseNet JSON datasets that were recorded with p5pose-recorder (above).
- [p5pose-optitrack](https://github.com/osteele/p5pose-optitrack) presents data from an OptiTrack motion capture setup as though it were PoseNet data. Students who have written a sketch to work with PoseNet data can run it on OptiTrack data by changing a line of code.
- In some circumstances, PoseNet runs faster when the sketch that is running PoseNet is different from the page that is running the animation. [Here's how](https://github.com/osteele/posenet-pubsub).
