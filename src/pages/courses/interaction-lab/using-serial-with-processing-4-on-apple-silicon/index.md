---
title: "Using Serial With Processing 4 on Apple Silicon"
layout: ../../../../layouts/BaseLayout.astro
---

[

🎶

Oliver’s Notes

](/)

# Overview

_**Processing 4.0.1**_ (the latest Processing release at the time of this writing) is not compatible with the [Serial library](https://processing.org/reference/libraries/serial/index.html) on [Apple Silicon (M1 and M2) computers](https://support.apple.com/en-us/HT211814).

This affects some Macintosh computers released as of late 2020, and almost all Macintosh computers that are sold today. It affects any sketch that uses `import processing.serial.*`, such as the examples in Libraries > Serial. It also affects any sketch that uses a contributed library that uses the serial port, such as [SerialRecord for Processing](https://osteele.github.io/Processing_SerialRecord/).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/9b6a673a-2700-4a22-9ccc-b1ed43aa6f4d/broken-examples/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/657db800-2556-4c64-8e4a-d58297edc99c/Screenshot_of_Arc_(10-24-22_6-14-29_PM)/w=1920,quality=90,fit=scale-down)

The bug report is [here](https://github.com/processing/processing4/issues/525). The reporter, @ekawahyu, describes the workaround: to copy the latest `jssc.jar` file into the Processing.app [bundle](https://en.wikipedia.org/wiki/Bundle_\(macOS\)). Additional commenters confirm this solution, and I have verified it on my own (M1 MacBook) computer.

# Do You Need This Workaround?

1.  _**Are you writing code that uses the Serial library**_ (for example, to receive or send data to an Arduino)? If you are ___not___ using the serial port, you do ___not___ need this workaround.
2.  _**Are you using a version of Processing that has the problem?**_ If you are using Processing 3, you do not need this workaround. If you are a version of Processing _newer than 4.0.1_, you _may_ not need this workaround. (As of today, the latest Processing version is 4.0.1. It looks like the fix for this problem is on track for inclusion in the next release of Processing, but until that actually happens, it is not possible to be certain of this.)
3.  _**Are you using an Apple Silicon computer?**_ Identify your computer. Choose “About this Computer”, in the Apple menu. Look next to the label “Chip”. If your chip is _not_ identified as an “Apple M1” or “Apple M2”, you do ___not___ need to follow these instructions.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/07ec5fe6-d43b-4b19-8c5d-8c51bf1f9490/about-this-mac/w=1920,quality=90,fit=scale-down)

# The Workaround

1.  Close the _**Processing**_ application, if it is open.
2.  Download `[https://github.com/java-native/jssc/releases/download/v2.9.4/jssc-2.9.4.jar](https://github.com/java-native/jssc/releases/download/v2.9.4/jssc-2.9.4.jar)` to your computer.
3.  On your computer, rename the downloaded file `jssc-2.9.4.jar` to `jssc.jar`.
4.  In the Finder, select the menu item _Go > Go to Folder…_.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/fd439f2a-11c7-4969-babe-02d6fc133180/menu-item/w=1920,quality=90,fit=scale-down)

6.  Enter `/Applications/Processing.app/Contents/Java/modes/java/libraries/serial/library/` and press return. (The easiest way to do this is to copy the name from this page, and paste it into the Go to Folder text entry area.)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6045eb6b-297a-4808-8ccc-53351e739e07/go-to-path/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e94068da-1a4a-407c-b458-0026c6159291/bundle-contents/w=1920,quality=90,fit=scale-down)

9.  Move the `jssc.jar` file, that you downloaded and renamed in a previous step, into this “library’ folder. The Finder will warn that _An older item named “jssc.jar” already exists in this location_, and ask whether to replace it. Click _Replace_.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4e1426cd-bc15-4fab-ba78-693df8ff2fc1/replace-confirmation/w=1920,quality=90,fit=scale-down)

11.  Now, launch the _**Processing**_ application.

At this point, the built-in examples that use the serial port, and the SerialRecord examples, should work.
