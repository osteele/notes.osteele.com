---
title: "Processing Cookbook"
layout: ../../../../../layouts/BaseLayout.astro
---

# Install the Sound Library

1. Select Tools > Reference Tool
    
    ![](/images/processing-cookbook/processing-cookbook-13.png)
    
2. A Contribution Manager window will appear. Click the Libraries tab.
    
    ![](/images/processing-cookbook/processing-cookbook-01.png)
    
3. Click the All popup menu on the right.
    
    ![](/images/processing-cookbook/processing-cookbook-05.png)
    
4. Select the *Sound* category
    
    ![](/images/processing-cookbook/processing-cookbook-06.png)
    
5. Select the *Sound* library from the list of libraries, and click *Install*
    
    ![](/images/processing-cookbook/processing-cookbook-07.png)
    

# Visual Studio Code for Processing

## Teaching VS Code to Recognize *.pde Files as Java

Visual Studio Code recognizes *.pde files (files that end in “.pde”) as text files. You can teach it that a these files as Java, This causes VS Code to display them as appears on the right, instead of on the left. It also allows you to format them (equivalent to Processing's “Auto Format” menu item), with the addition of another extension (the following recipe).

![Language Mode: Text. Color Theme: Light.](/images/processing-cookbook/processing-cookbook-08.png)

Language Mode: Text. Color Theme: Light.

![Language Mode: Java. Color Theme: Light.](/images/processing-cookbook/processing-cookbook-09.png)

Language Mode: Java. Color Theme: Light.

To teach it to recognize *.pde files as Java, install the [Processing Language extension](https://marketplace.visualstudio.com/items?itemName=Tobiah.language-pde) through *one of* these two mechanisms:

***Method 1: Using the link***. Click on [the link](https://marketplace.visualstudio.com/items?itemName=Tobiah.language-pde). Click Install.  Allow the page to open “Visual Studio Code”. Then follow step 4 below.

![](/images/processing-cookbook/processing-cookbook-10.png)

***Method 2: Searching for the extension***. Open Visual Studio Code. In the Visual Studio Code action bar (on the left), click the Extensions icon. Search for “Processing”. Click the “Processing Language” item in the results. Click on Install.

![](/images/processing-cookbook/processing-cookbook-11.png)

Once installed by using, the pane in Visual Studio Code should show the “Disable” and “Uninstall” buttons. (Don't click on either one! We want to keep it installed.)

![](/images/processing-cookbook/processing-cookbook-12.png)

## Format Processing Sketches

VS Code can be configured to format sketch files. This changes them from the poorly-indented text on the left, to the text on the right. Formatting is triggered by a Format menu item. VS Code can also be configured to format a file every time that it is saved.

***Installation***:

- Install the [Language Support for Java](https://marketplace.visualstudio.com/items?itemName=redhat.java) extension. See the instructions in the “Teaching VS Code to Recognize *.pde Files as Java” for how to install an extension.
    
    ![](/images/processing-cookbook/processing-cookbook-02.png)
    

- Download and install the Java development Kit from [https://adoptopenjdk.net](https://adoptopenjdk.net/). You can leave the default Version and JVM selected, and simply click on Latest release.
    
    ![VS Code will prompt to install the JDK, once the Language Support extension is installed.](/images/processing-cookbook/processing-cookbook-03.png)
    
    VS Code will prompt to install the JDK, once the Language Support extension is installed.
    
    ***Usage***: 
    

![The web site. Click on Latest release.](/images/processing-cookbook/processing-cookbook-04.png)

The web site. Click on Latest release.
