---
title: "Movement Practices Lab 1: Pose Detection with PoseNet"
layout: ../../../../layouts/BaseLayout.astro
---

# Introduction to PoseNet

![](/images/movement-practices-lab-1-pose-detection-with-posenet/image1.gif)

[***PoseNet***](https://www.tensorflow.org/lite/models/pose_estimation/overview) is a machine learning vision model that estimates the pose of a person in an image or video by estimating where key body joints are.

PoseNet runs in Python, JavaScript, and C++. In class, we will be using the JavaScript version.

**p5.js**

[***p5.js***](https://p5js.org/) is a JavaScript library with the goal of making coding accessible to artists, designers, educators, and beginners.

p5.js is inspired by—and very similar to—[Processing](https://processing.org/). If you know Processing, many of the concepts in p5.js will look familiar (and vice versa). Unlike Processing, p5.js uses JavaScript, and runs in a web browser (including on mobile devices).

**ml5.js**

[***ml5.js***](https://ml5js.org/) simplifies the creation and exploration of programs that use artificial intelligence (machine learning) algorithms in a web page.

In this assignment, we will employ ml5.js as a means to access PoseNet.

ml5.js is developed and maintained by NYU ITP.

# **Explore the PoseNet Demo Site**

[https://storage.googleapis.com/tfjs-models/demos/posenet/camera.html](https://storage.googleapis.com/tfjs-models/demos/posenet/camera.html)

- Chrome is better than Safari

Stand back from the computer so it sees your whole body, and work with others in the class, asking them to move and pose.

Questions:

Q. Try out different poses. What is PoseNet good at? What breaks it?

Q. What frame rate (fps) does your computer report? (This is the number at the upper left corner.) Send this in Slack.
Q. What effect does confidence levels have?
Take notes to answer in the homework assignment.

# **Use PoseNet on Your Computer**

In this activity, you will use the browser version of p5.js, which is maintained by the Processing Foundation. We recommend running it in Chrome, (we can try other browsers in class).
You will run our class “starter kit” project that uses PoseNet (it’s based on, and similar to, public demo code for PoseNet). You will become familiar with the browser interface to p5, and you will modify the program.
You will create an account on openprocessing.org so that you can create and save versions of the program to make your own projects using PoseNet.

## **A. Run the Project Code**

It is at:

[https://www.openprocessing.org/sketch/1073957](https://www.openprocessing.org/sketch/1073957)

To run the sketch, click on the run icon. To stop, click on the stop button. To restart the sketch while running, note that the run icon has changed appearance to a restart icon.

## **B. Explore Posenet**

Now you’ve got PoseNet running. Try it, and explore how well it works with wherever your laptop camera is aimed. Re-explore some of the earlier questions and think of other ones.

Try out different poses. What is PoseNet good at? What breaks it? Take notes to answer in the homework assignment.

## **C. Create a new project and make a change**

*Objective: verify that you can create a new project and change the behavior and appearance of the PoseNet starter kit program.*

1. Use the p5 interface to set up the screen layout to see both the project code and the PoseNet running sketch.
2. Find the line `ellipse(keypoint.position.x, keypoint.position.y, 10, 10);`. Change one of the `10`s to a `20`.
3. Restart the sketch. It should still be using PoseNet, with a slightly different appearance.

## **D. Save your change; create a new project**

Objective: Share your project

1. Save your change.
2. The p5 interface will ask you to create an account so that you can save your projects.
3. Put the URL of your new project into Slack.

## **E. Make more changes:**

Objectives:

- Learn your way around the PoseNet project by making modifications.
- Get some ideas for PoseNet projects.
- Build up your own systems for remembering how to find reference material.
- Practice using p5.js (and maybe JavaScript) documentation.

### E1: Modify the `keypoints` Display

Make use of at least one p5.js function that is not used in the original code base, to spice up the visual display. Suggestions: use other shapes. Going beyond: use vertex, place images
Posenet working tip: Make time to work with others in class, as it is easier to try out changes when one person is far from the camera and one is modifying the code.
General working tip with programming in openProcessing: Make small changes and save often!

Send a screenshot to Slack.

### E1: Experiment with Confidence Levels

The code as distributed draws only keypoints with a certain confidence level. Change the confidence level to a different number. Does that have a noticeable effect?

## **F. Make even more changes:**

### A Refresher

A PoseNet ***pose*** contains two sets of arrays:

- An array of ***keypoints***. These are joint positions, labeled with the name and number of the joint.
- An array of ***skeletons***. (Other motion tracking systems call these *bones*.) Each item in this array is itself an array of two keypoints.

You can read more about some of this in this page of [PoseNet documentation](https://github.com/tensorflow/tfjs-models/blob/master/posenet/README.md#single-person-pose-estimation).

### F1: Modify the Skeleton Display

- The starter code draws the PoseNet bones (“skeletons”) as thin red lines. Make them thicker. (You can also try different colors.)
- Optional advanced version: Set the color or thickness of the bone depending on the confidence score of the connected keypoints.

### F2: Leave a Trace

1. Find the line in the sketch:

**image**(video, 0, 0);

“Comment it out” by prefixing the line with two forward slashes //. This *disables* it — it tells the computer not to execute it — but it leaves the code in a form where it can easily be *enabled* again.

// **image**(video, 0, 0,);

What do you expect to change?

Now view the program in the browser. What changed?

2. Right above (or below) the line that you commented out, add this line:

**background**(0,0,0);

This draws the background on each frame. The background is drawn with a *color* composed of three lights of color red, green, and blue (R, G, and B). In this case each light intensity is set to 0, so the background is drawn in *black*.

We could have just written **background**("black"). The rgb notation is a better setup for:

3. Replace the background line with:

**background**(0, 0, 0, 5);

The background is drawn with semi-transparent black, that lets most of the background show through. This color is 0.05 opaque, which is 5% opaque or 95% translucent.

# Resources

[PoseNet starter and Notes from Oliver Steele CCL 2020](https://docs.google.com/document/d/1VynqGARPcmhPnZX7cSf7hJe7wmGG7SJbNvRtX2pdrPw/edit?usp=sharing)[https://notes.osteele.com/posenet](https://notes.osteele.com/posenet)

[PoseNet documentation](https://github.com/tensorflow/tfjs-models/blob/master/posenet/README.md#single-person-pose-estimation) from tensorflow/tfjs-models

[ml5js.org](https://learn.ml5js.org/#/)

[openprocessing.org](https://www.openprocessing.org/)

[P5 reference](https://p5js.org/reference/) (also available through the p5 browser interface)

Some P5 cheat sheets:[https://bmoren.github.io/p5js-cheat-sheet/](https://bmoren.github.io/p5js-cheat-sheet/)[https://bmoren.github.io/p5js-cheat-sheet/zh.html](https://bmoren.github.io/p5js-cheat-sheet/zh.html) (Chinese comments)

[https://www.dropbox.com/s/ittkfaw3987u45r/Cheetsheet.pdf?dl=0](https://www.dropbox.com/s/ittkfaw3987u45r/Cheetsheet.pdf?dl=0)
