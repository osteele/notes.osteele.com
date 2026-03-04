---
title: "Connecting P5.js to Zoom"
layout: ../../../../layouts/BaseLayout.astro
---

-   [
    
    Overview
    
    ](#block-ea945f3faf4549c08666c45da1d7d5cf)
-   [
    
    Steps
    
    ](#block-1b7d760bfb2541f9b0563a1efa59e461)
-   [
    
    Install and Launch OBS and Chrome
    
    ](#block-72343ce641e24601940fe46011a39374)
-   [
    
    Create an OBS Scene
    
    ](#block-d93dad6d4de04212867ac08017b8b44d)
-   [
    
    Add an OBS Source
    
    ](#block-56906ba662d64f6580e0069d9669b151)
-   [
    
    Connect OBS to Zoom
    
    ](#block-5f6191faaad5495b921caa5570057af4)
-   [
    
    After class…
    
    ](#block-dbe3461ade07495fae9d6e1f03352abb)
-   [
    
    Troubleshooting
    
    ](#block-0d3db7a55fa34626959a0721d407805b)
-   [
    
    Site Doesn’t Have Permission to Use the Webcam
    
    ](#block-7b5e2e33fc284fa7bb2c744cc382e1c7)
-   [
    
    BlazePose Is Using the Wrong Webcam
    
    ](#block-4d9478913671415ab7eaf1b65ee1b96e)

# Overview

These instructions configure Zoom on your computer so that it displays a live image from a web page, instead of displaying the video from your webcam.

They do this by using _OBS Studio_ to create a virtual camera, that looks to Zoom like a webcam but can be configured to provide video from a web page instead of from the actual webcam.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2c9c8a84-8b92-4301-bc35-a591ac65a551/Screenshot_of_Microsoft_Edge_(4-28-22_5-09-06_PM)/w=1920,quality=90,fit=scale-down)

Using OBS for this is different from using Zoom’s screen share feature. The OBS virtual camera it replaces your own image _in the gallery_, instead of showing your shared screen _next to_ the gallery. This will allow us to create a room full of people who _each_ display in the gallery as computational or augmented images, instead of only being able to display one person’s screen at a time.

![Zoom, with screen sharing](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/c8bf3602-796b-4db5-b211-88ff85f504e8/Screenshot_of_Microsoft_Edge_(4-28-22_5-26-38_PM)/w=1920,quality=90,fit=scale-down)

Zoom, with screen sharing

![Zoom + OBS, with virtual cameras](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ea8651e7-85df-4709-9f47-814853b5fbdc/Screenshot_of_Microsoft_Edge_(4-28-22_5-27-48_PM)/w=1920,quality=90,fit=scale-down)

Zoom + OBS, with virtual cameras

Note: Running all these programs at once will take a lot of effort from your computer. It has worked on some laptops that we tested with, but just barely. Hopefully it will work on yours. If it is too taxing for your computer, let us know and we will figure out a different approach.

# Steps

## Install and Launch OBS and Chrome

1.  Download OBS from [here](https://obsproject.com/download), and install it.
2.  Launch OBS.
3.  Launch Chrome, if it is not already launched.
4.  Open the [https://openprocessing.org/sketch/1556869](https://openprocessing.org/sketch/1556869) [https://poseshare.underconstruction.fun/](https://poseshare.underconstruction.fun/) URL in Chrome.

## Create an OBS Scene

Using the + button under the Scenes menu, create a Scene. Name it Choreography. Click on it to select it.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b59c204a-3a53-4f16-856a-cb3547f24a5e/Screenshot_of_OBS_(4-28-22_4-36-07_PM)/w=1920,quality=90,fit=scale-down)

## Add an OBS Source

Using the + button under the _Sources_ menu, create a _Window Capture_ source. Name the source “PoseShare (Chrome)” (or any name that will allow you to find and recognize the source later).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f2220b9c-3c15-474d-b148-8a8e8a0fc5ae/Screenshot_of_OBS_(4-28-22_4-36-52_PM)/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/9f600fc5-45e7-474f-9f6f-b08840fc776d/Screenshot_of_OBS_(4-28-22_4-36-40_PM)/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/63ef417c-2755-4de2-b1a9-86ed1a9af573/Screenshot_of_OBS_(4-28-22_4-37-10_PM)/w=1920,quality=90,fit=scale-down)

Use the _Window_ popup menu to select the Google Chrome window.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/54d78547-f9e4-45d3-9b6e-1e141a728eb9/Untitled/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ababb0af-5735-4a53-b00b-51ad47b9efbc/Screenshot_of_OBS_(4-28-22_4-42-22_PM)/w=1920,quality=90,fit=scale-down)

In the top part of the OBS window, you will see a live capture of the video source (the browser window). It is surrounded by a red or green border. At each corner, and in the middle of each edge, is a small red rectangle (“handle”).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4efbc842-ba6b-4687-8f18-deca9ac260a1/Screenshot_of_Notion_(4-28-22_4-46-01_PM)/w=1920,quality=90,fit=scale-down)

Use these gestures to crop the source so that includes only the Webcam portion of the web page, and to move and resize it so that it fills the height of the OBS window.

-   In order to _resize_ the image, drag the handles.
-   In order to _crop_ the image, Option-drag (macOS) or Alt-drag (Windows) the handles.
-   In order to _move_ the image, drag within the source rectangle.

## Connect OBS to Zoom

**In OBS**, click the _Start Virtual Camera_ button in the lower right corner of the OBS window (the left screenshot).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/8db64a07-7515-47c6-bd53-523adf1b6849/Screenshot_of_OBS_(4-28-22_6-28-58_PM)/w=1920,quality=90,fit=scale-down)

As an alternative, you may instead select _Tools > Start Virtual Camera_.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/49b6031f-35be-47a1-bcec-8487ee8b6a13/Screenshot_of_Notion_(4-28-22_4-51-36_PM)/w=1920,quality=90,fit=scale-down)

**In Zoom**, choose OBS Virtual Camera from the Video menu.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ceacbaed-8f7a-48bb-85ba-2d08962122f2/Screenshot_of_zoom.us_(4-28-22_4-53-21_PM)/w=1920,quality=90,fit=scale-down)

If everything is working, your Zoom gallery square should now display the contents of the Chrome window.

## After class…

Don’t forget to switch your camera back to your built-in webcam before your next Zoom meeting! (Unless you want to use p5.js to create your own avatar…)

In addition to the Video menu in the meeting controls area, you can also select the webcam in the Zoom _Preferences_.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/8d9d3eb1-7983-4165-8819-06151072fea5/Screenshot_of_Notion_(4-28-22_4-55-50_PM)/w=1920,quality=90,fit=scale-down)

# Troubleshooting

## Site Doesn’t Have Permission to Use the Webcam

If you clicked “no” when the site asked to use the camera, you will need to go into Settings to give it permission. Follow [these instructions](https://camblyenglish.zendesk.com/hc/en-us/articles/360000312703-My-camera-isn-t-working-in-Google-Chrome).

## BlazePose Is Using the Wrong Webcam

If your computer has multiple webcams connected, Chrome may choose the wrong one. This can be the case if you have installed a virtual webcam such as Snap Camera or OBS, or have connected your computer to an external webcam or a display that includes one.

If this is the case, follow the instructions [here](https://camblyenglish.zendesk.com/hc/en-us/articles/360049146312-How-To-Set-Your-Preferred-Camera-in-Google-Chrome) to direct Chrome to use the appropriate camera. Then refresh the page.

Use the Camera menu to select a different webcam.
