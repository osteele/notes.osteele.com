---
title: "Connecting P5.js to Zoom"
layout: ../../../../layouts/BaseLayout.astro
---

# Overview

These instructions configure Zoom on your computer so that it displays a live image from a web page, instead of displaying the video from your webcam.

They do this by using *OBS Studio* to create a virtual camera, that looks to Zoom like a webcam but can be configured to provide video from a web page instead of from the actual webcam.

![Screenshot of Microsoft Edge (4-28-22, 5-09-06 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_Microsoft_Edge_%284-28-22_5-09-06_PM%29.png)

Using OBS for this is different from using Zoom’s screen share feature. The OBS virtual camera it replaces your own image *in the gallery*, instead of showing your shared screen *next to* the gallery. This will allow us to create a room full of people who *each* display in the gallery as computational or augmented images, instead of only being able to display one person’s screen at a time.

![Zoom, with screen sharing](/images/connecting-p5js-to-zoom/Screenshot_of_Microsoft_Edge_%284-28-22_5-26-38_PM%29.png)

Zoom, with screen sharing

![Zoom + OBS, with virtual cameras](/images/connecting-p5js-to-zoom/Screenshot_of_Microsoft_Edge_%284-28-22_5-27-48_PM%29.png)

Zoom + OBS, with virtual cameras

Note: Running all these programs at once will take a lot of effort from your computer. It has worked on some laptops that we tested with, but just barely. Hopefully it will work on yours. If it is too taxing for your computer, let us know and we will figure out a different approach.

# Steps

## Install and Launch OBS and Chrome

1. Download OBS from [here](https://obsproject.com/download), and install it.
2. Launch OBS.
3. Launch Chrome, if it is not already launched.
4. Open the [~~https://openprocessing.org/sketch/1556869~~](https://openprocessing.org/sketch/1556869) [https://poseshare.underconstruction.fun/](https://poseshare.underconstruction.fun/) URL in Chrome.

## Create an OBS Scene

Using the + button under the Scenes menu, create a Scene. Name it Choreography. Click on it to select it.

![Screenshot of OBS (4-28-22, 4-36-07 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_4-36-07_PM%29.png)

## Add an OBS Source

Using the + button under the *Sources* menu, create a *Window Capture* source. Name the source “PoseShare (Chrome)” (or any name that will allow you to find and recognize the source later).

![Screenshot of OBS (4-28-22, 4-36-52 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_4-36-52_PM%29.png)

![Screenshot of OBS (4-28-22, 4-36-40 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_4-36-40_PM%29.png)

![Screenshot of OBS (4-28-22, 4-37-10 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_4-37-10_PM%29.png)

Use the *Window* popup menu to select the Google Chrome window.

![Untitled](/images/connecting-p5js-to-zoom/Untitled.png)

![Screenshot of OBS (4-28-22, 4-42-22 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_4-42-22_PM%29.png)

In the top part of the OBS window, you will see a live capture of the video source (the browser window). It is surrounded by a red or green border. At each corner, and in the middle of each edge, is a small red rectangle (“handle”).

![Screenshot of Notion (4-28-22, 4-46-01 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_Notion_%284-28-22_4-46-01_PM%29.png)

Use these gestures to crop the source so that includes only the Webcam portion of the web page, and to move and resize it so that it fills the height of the OBS window.

- In order to *resize* the image, drag the handles.
- In order to *crop* the image, Option-drag (macOS) or Alt-drag (Windows) the handles.
- In order to *move* the image, drag within the source rectangle.

## Connect OBS to Zoom

**In OBS**, click the *Start Virtual Camera* button in the lower right corner of the OBS window (the left screenshot).

![Screenshot of OBS (4-28-22, 6-28-58 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_OBS_%284-28-22_6-28-58_PM%29.png)

As an alternative, you may instead select *Tools > Start Virtual Camera*.

![Screenshot of Notion (4-28-22, 4-51-36 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_Notion_%284-28-22_4-51-36_PM%29.png)

**In Zoom**, choose OBS Virtual Camera from the Video menu.

![Screenshot of zoom.us (4-28-22, 4-53-21 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_zoom.us_%284-28-22_4-53-21_PM%29.png)

If everything is working, your Zoom gallery square should now display the contents of the Chrome window.

## After class…

Don’t forget to switch your camera back to your built-in webcam before your next Zoom meeting! (Unless you want to use p5.js to create your own avatar…)

In addition to the Video menu in the meeting controls area, you can also select the webcam in the Zoom *Preferences*.

![Screenshot of Notion (4-28-22, 4-55-50 PM).png](/images/connecting-p5js-to-zoom/Screenshot_of_Notion_%284-28-22_4-55-50_PM%29.png)

# Troubleshooting

## Site Doesn’t Have Permission to Use the Webcam

If you clicked “no” when the site asked to use the camera, you will need to go into Settings to give it permission. Follow [these instructions](https://camblyenglish.zendesk.com/hc/en-us/articles/360000312703-My-camera-isn-t-working-in-Google-Chrome).

## BlazePose Is Using the Wrong Webcam

~~If your computer has multiple webcams connected, Chrome may choose the wrong one. This can be the case if you have installed a virtual webcam such as Snap Camera or OBS, or have connected your computer to an external webcam or a display that includes one.~~

~~If this is the case, follow the instructions [here](https://camblyenglish.zendesk.com/hc/en-us/articles/360049146312-How-To-Set-Your-Preferred-Camera-in-Google-Chrome) to direct Chrome to use the appropriate camera. Then refresh the page.~~

Use the Camera menu to select a different webcam.
