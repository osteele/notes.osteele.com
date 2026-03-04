---
title: "Cross-fade Between Songs"
layout: ../../../../layouts/BaseLayout.astro
---

Smoothly transition between two audio tracks using p5.sound.

```javascript
let song1, song2;
let fadeTime = 2; // seconds

function preload() {
  song1 = loadSound('song1.mp3');
  song2 = loadSound('song2.mp3');
}

function setup() {
  createCanvas(400, 200);
  song1.setVolume(1);
  song2.setVolume(0);
}

function draw() {
  background(220);
  text('Press 1 for Song 1', 20, 50);
  text('Press 2 for Song 2', 20, 80);
  text('Song 1 volume: ' + song1.getVolume().toFixed(2), 20, 130);
  text('Song 2 volume: ' + song2.getVolume().toFixed(2), 20, 160);
}

function crossFade(from, to) {
  // Start the target song if not playing
  if (!to.isPlaying()) {
    to.play();
  }

  // Fade out the current song
  from.setVolume(0, fadeTime);

  // Fade in the target song
  to.setVolume(1, fadeTime);
}

function keyPressed() {
  if (key === '1') {
    if (!song1.isPlaying()) song1.play();
    crossFade(song2, song1);
  } else if (key === '2') {
    if (!song2.isPlaying()) song2.play();
    crossFade(song1, song2);
  }
}
```

## Related

<ul class="page-list"><li><a href="/p5js/examples/">All Examples</a></li></ul>
