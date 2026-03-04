---
title: "Processing Cookbook"
layout: ../../../../../layouts/BaseLayout.astro
---

![Processing Cookbook](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5f4b0921-51d1-4926-bcf7-a8a2899c7c96/processing-web/w=1920,quality=90,fit=scale-down)

👩🏼‍🍳

[

🎶

Oliver’s Notes

](/)

# Install the Sound Library

1.  Select Tools > Reference Tool

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/88848272-e0da-44c9-8af2-ae1b57dca90e/Untitled/w=1920,quality=90,fit=scale-down)

3.  A Contribution Manager window will appear. Click the Libraries tab.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/022feddf-8b89-4cd9-86fc-ad3c8e46c5ce/Untitled/w=1920,quality=90,fit=scale-down)

5.  Click the All popup menu on the right.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f9d37b87-7e60-48de-bc67-c43e284a3fe4/Untitled/w=1920,quality=90,fit=scale-down)

7.  Select the _Sound_ category

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/9838ab6e-df73-4ed5-8bf9-e0d27f66bfca/Untitled/w=1920,quality=90,fit=scale-down)

10.  Select the _Sound_ library from the list of libraries, and click _Install_

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/86ff91db-9274-40b5-86ea-3992f0efc6f8/Untitled/w=1920,quality=90,fit=scale-down)

# Visual Studio Code for Processing

## Teaching VS Code to Recognize \*.pde Files as Java

Visual Studio Code recognizes \*.pde files (files that end in “.pde”) as text files. You can teach it that a these files as Java, This causes VS Code to display them as appears on the right, instead of on the left. It also allows you to format them (equivalent to Processing's “Auto Format” menu item), with the addition of another extension (the following recipe).

![Language Mode: Text. Color Theme: Light.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4f06fbb3-6a06-4201-8875-068be91438fc/Untitled/w=1920,quality=90,fit=scale-down)

Language Mode: Text. Color Theme: Light.

![Language Mode: Java. Color Theme: Light.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5734f15d-56a7-448a-9588-b9b5b7ca99c2/Untitled/w=1920,quality=90,fit=scale-down)

Language Mode: Java. Color Theme: Light.

To teach it to recognize \*.pde files as Java, install the [Processing Language extension](https://marketplace.visualstudio.com/items?itemName=Tobiah.language-pde) through _one of_ these two mechanisms:

_**Method 1: Using the link**_. Click on [the link](https://marketplace.visualstudio.com/items?itemName=Tobiah.language-pde). Click Install. Allow the page to open “Visual Studio Code”. Then follow step 4 below.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/bf75ef74-715d-4d5e-93f6-61ee90cd0ca5/Untitled/w=1920,quality=90,fit=scale-down)

_**Method 2: Searching for the extension**_. Open Visual Studio Code. In the Visual Studio Code action bar (on the left), click the Extensions icon. Search for “Processing”. Click the “Processing Language” item in the results. Click on Install.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/89756396-1489-425c-ba08-ff248d616dc8/Untitled/w=1920,quality=90,fit=scale-down)

Once installed by using, the pane in Visual Studio Code should show the “Disable” and “Uninstall” buttons. (Don't click on either one! We want to keep it installed.)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f623caba-dd8d-4a46-90a9-da9137b28b8f/Untitled/w=1920,quality=90,fit=scale-down)

## Format Processing Sketches

VS Code can be configured to format sketch files. This changes them from the poorly-indented text on the left, to the text on the right. Formatting is triggered by a Format menu item. VS Code can also be configured to format a file every time that it is saved.

_**Installation**_:

-   Install the [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java) extension. See the instructions in the “Teaching VS Code to Recognize \*.pde Files as Java” for how to install an extension.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/95dd37c0-0545-4a30-99b3-f4a41f4b51b1/Untitled/w=1920,quality=90,fit=scale-down)

-   Download and install the Java development Kit from [https://adoptopenjdk.net](https://adoptopenjdk.net/). You can leave the default Version and JVM selected, and simply click on Latest release.

![VS Code will prompt to install the JDK, once the Language Support extension is installed.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/615d1aab-cb17-4f3d-b9b3-5bbda96eb1a3/Untitled/w=1920,quality=90,fit=scale-down)

VS Code will prompt to install the JDK, once the Language Support extension is installed.

_**Usage**_:

![The web site. Click on Latest release.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2164fbec-4da0-4671-949b-a7586ceab608/Untitled/w=1920,quality=90,fit=scale-down)

The web site. Click on Latest release.
