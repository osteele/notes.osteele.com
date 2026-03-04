---
title: "PoseNet"
layout: ../../layouts/BaseLayout.astro
---

PoseNet is a machine learning tool that estimates poses (joint positions of a human figure) from a webcam or other image data. It runs in web browsers and is compatible with p5.js and other JavaScript programs.

## References

<ul class="page-list"><li><a href="https://learn.ml5js.org/#/reference/posenet">ml5.js PoseNet API</a> – For p5.js integration</li><li><a href="https://github.com/tensorflow/tfjs-models/tree/master/posenet">TensorFlow PoseNet GitHub</a> – Browser-based implementation</li></ul>

## Getting Started

Three starter options:

<ul class="page-list"><li><a href="https://openprocessing.org/sketch/817495">OpenProcessing.org template</a> – Click code icon to edit</li><li><a href="https://glitch.com/~posenet-starter">Glitch remix version</a></li><li>Local development with p5pose (recommended for avoiding nested iteration indices)</li></ul>

## Camera Selection

For multi-camera setups (especially with virtual cameras like Snap Camera):

1.  File > Preferences
2.  Privacy and security > Site Settings
3.  Permissions > Camera
4.  Select correct camera from dropdown menu

## Oliver's Custom Tools

<ul class="page-list"><li><a href="https://github.com/osteele/p5pose-recorder">p5pose-recorder</a> – Captures PoseNet data to JSON with timeline editing</li><li><a href="https://github.com/osteele/p5pose-playback">p5pose-playback</a> – Menu system for switching between webcam and recorded datasets</li><li><a href="https://github.com/osteele/p5pose-optitrack">p5pose-optitrack</a> – Presents OptiTrack motion capture as PoseNet data</li></ul>

<div class="callout"><p><strong>Performance tip:</strong> Running PoseNet sketch separately from animation page improves speed.</p></div>

## Related

<ul class="page-list"><li><a href="/p5js/">p5.js Resources</a></li><li><a href="/creative-coding/">Creative Coding</a></li></ul>
