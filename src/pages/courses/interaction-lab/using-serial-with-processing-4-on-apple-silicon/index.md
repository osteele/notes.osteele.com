---
title: "Using Serial With Processing 4 on Apple Silicon"
layout: ../../../../layouts/BaseLayout.astro
---

# Overview

***Processing 4.0.1*** (the latest Processing release at the time of this writing) is not compatible with the [Serial library](https://processing.org/reference/libraries/serial/index.html) on [Apple Silicon (M1 and M2) computers](https://support.apple.com/en-us/HT211814).

This affects some Macintosh computers released as of late 2020, and almost all Macintosh computers that are sold today. It affects any sketch that uses `import processing.serial.*`, such as the examples in Libraries > Serial. It also affects any sketch that uses a contributed library that uses the serial port, such as [SerialRecord for Processing](https://osteele.github.io/Processing_SerialRecord/).

![broken-examples.png](/images/using-serial-with-processing-4-on-apple-silicon/broken-examples.png)

![Screenshot of Arc (10-24-22, 6-14-29 PM).png](/images/using-serial-with-processing-4-on-apple-silicon/Screenshot_of_Arc_%2810-24-22_6-14-29_PM%29.png)

The bug report is [here](https://github.com/processing/processing4/issues/525). The reporter, @ekawahyu, describes the workaround: to copy the latest `jssc.jar` file into the Processing.app [bundle](https://en.wikipedia.org/wiki/Bundle_(macOS)). Additional commenters confirm this solution, and I have verified it on my own (M1 MacBook) computer.

# Do You Need This Workaround?

1. ***Are you writing code that uses the Serial library*** (for example, to receive or send data to an Arduino)? If you are *not* using the serial port, you do *not* need this workaround.
2. ***Are you using a version of Processing that has the problem?*** If you are using Processing 3, you do not need this workaround. If you are a version of Processing *newer than 4.0.1*, you *may* not need this workaround. (As of today, the latest Processing version is 4.0.1. It looks like the fix for this problem is on track for inclusion in the next release of Processing, but until that actually happens, it is not possible to be certain of this.)
3. ***Are you using an Apple Silicon computer?*** Identify your computer. Choose “About this Computer”, in the Apple menu. Look next to the label “Chip”. If your chip is *not* identified as an “Apple M1” or “Apple M2”, you do *not* need to follow these instructions.
    
    ![about-this-mac.png](/images/using-serial-with-processing-4-on-apple-silicon/about-this-mac.png)
    

# The Workaround

1. Close the ***Processing*** application, if it is open.
2. Download [`https://github.com/java-native/jssc/releases/download/v2.9.4/jssc-2.9.4.jar`](https://github.com/java-native/jssc/releases/download/v2.9.4/jssc-2.9.4.jar) to your computer.
3. On your computer, rename the downloaded file `jssc-2.9.4.jar` to `jssc.jar`.
4. In the Finder, select the menu item *Go > Go to Folder…*.
    
    ![menu-item.png](/images/using-serial-with-processing-4-on-apple-silicon/menu-item.png)
    
5. Enter `/Applications/Processing.app/Contents/Java/modes/java/libraries/serial/library/` and press return. (The easiest way to do this is to copy the name from this page, and paste it into the Go to Folder text entry area.)
    
    ![go-to-path.png](/images/using-serial-with-processing-4-on-apple-silicon/go-to-path.png)
    
    ![bundle-contents.png](/images/using-serial-with-processing-4-on-apple-silicon/bundle-contents.png)
    
6. Move the `jssc.jar` file, that you downloaded and renamed in a previous step, into this “library’ folder.
The Finder will warn that *An older item named “jssc.jar” already exists in this location*, and ask whether to replace it. Click *Replace*.
    
    ![replace-confirmation.png](/images/using-serial-with-processing-4-on-apple-silicon/replace-confirmation.png)
    
7. Now, launch the ***Processing*** application.

At this point, the built-in examples that use the serial port, and the SerialRecord examples, should work.
