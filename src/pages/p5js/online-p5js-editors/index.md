---
title: "Online P5.js Editors"
layout: ../../../layouts/BaseLayout.astro
---

You can edit and run your p5.js code in an online editor (such as the [P5 Web Editor](https://editor.p5js.org/), [OpenProcessing.org](/p5js-resources/), or [Glitch](/p5js-resources/)); or, in an application that you runs on your computer (such as Visual Studio Code or Atom).

## Online p5.js Playgrounds

Some online editors are specific to p5.js. They are easy to get started with.

- [OpenProcessing.org](https://www.openprocessing.org/). This site has good tutorials, and lets you browse other people's portfolios and examples. Notes:
    - Pros: Project history, project description and instructions, easy to add libraries, powerful editing tools (multiple selection, find all matching words).
    - Cons: Does not auto-update (press command-return); does not auto-save (press command-S).
    - In order to see your code and the canvas *at the same time*, press the ⋮ icon in the upper right, click Editor, and switch to the second Layout.
    - If an error occurs, or your code uses `console.log()` or `console.write()` it will cause the Console to pop up on the bottom of the page. This covers your source code and makes it difficult to edit. Click the ⨉ at the top right of the console to dismiss it.
    - Warning: this site does *not* automatically save your work. You will need to press the **Save** button from time to time.
- [p5.js Web Editor](https://editor.p5js.org/). Notes:
    - Run the p5.js Web Editor in Chrome. In Safari, errors are reported as occurring on line 0. This makes it difficult to develop.
    - This web editor uses an older version of JavaScript. Not every p5.js program will run in it.

Other online editors are more flexible, but also require more work in order to set up a p5.js project.

- [Glitch](https://glitch.com/) is good for real-time collaboration. Notes:
    - In order to create a p5.js sketch, *remix* [this template](https://glitch.com/edit/#!/cclab-p5js-template) (adapted from one by J.H. Moon). Then edit the sketch.js file.
    - Unlike the playgrounds above, Glitch does not display the console when your program has an error. Follow [these instructions](https://debugbrowser.com/) to display the JavaScript Console in the browser tab that is running your sketch.
