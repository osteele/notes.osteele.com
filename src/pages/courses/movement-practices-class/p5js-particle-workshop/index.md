---
title: "p5.js Particle Workshop"
layout: ../../../../layouts/BaseLayout.astro
---

During this workshop, you will _start from_ an empty [p5.js](https://p5js.org) web page and _progress through_ a series of “particle systems” animations.

The goal of this workshop is to help you become aware of some of the tools and techniques that are available in JavaScript and in p5.js, and to practice some of the element of a productive programming workflow. You might never write your own particle system after this workshop! (There are libraries for this, for p5.js and for other platforms.) Rather, the things that we practice today will be useful to you in your programming in general, and can be applied to coding other parts of your project (and to programming outside this course).

You are not expected to remember exactly how to use everything that appears on the screen. Instead, now that you have seen that they exist, you can ask the instructors and others how to do a thing, when you recognize that it may be useful in your own work. Also, after class we will post the code that was used today, so that you can refer back to it.

# Set up your workspace

The instructions for configuring Visual Studio Code and Chrome for web development have moved [here](https://www.notion.so/Configuring-a-Workspace-for-P5-js-Development-775bcd1d366443d5816f9e32e7e9d2b8).

## A. Configure Visual Studio Code

1.  Launch Visual Studio Code.
2.  Verify that File > Auto Save is enabled:

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/8c3bf102-96db-40bb-9e3f-2ce54a979eec/Untitled/w=1920,quality=90,fit=scale-down)

3\. Open the Extensions panel ①. Search for the “Live Server” extension ②. Install it ③.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/009a0cff-046c-4b78-a100-b78f61bfef9c/Untitled/w=1920,quality=90,fit=scale-down)

## B. Download the project starter kit

1.  In a terminal, run `git clone https://github.com/osteele/p5-particle-workshop.git`
2.  In Visual Studio Code, open the `p5-particle-workshop`
3.  In Visual Studio Code, open the `sketch.js` file.
4.  In Visual Studio Code, click the Go Live button

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/84c0c41e-b7b9-4fe3-a217-b8cbe83e67d9/Untitled/w=1920,quality=90,fit=scale-down)

## C. Configure Chrome

1\. Chrome (or your preferred browser) should open a tab that displays the sketch. (The current sketch is blank.)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2adb2d2d-fbe9-4442-bdd6-a62a69e1a139/Untitled/w=1920,quality=90,fit=scale-down)

2\. Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ed6981ba-3835-42e8-a959-7084e0a56c18/Screenshot_of_Google_Chrome_(2019-11-21_1-57-20_PM)/w=1920,quality=90,fit=scale-down)

## D. Arrange your windows

1\. Configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/edc0a073-010f-4925-aacb-b1ff97010930/Untitled/w=1920,quality=90,fit=scale-down)

2\. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/566a22e1-a3eb-49a6-b961-d48cb7a86031/Untitled/w=1920,quality=90,fit=scale-down)

# Live Coding

Now follow along as we create setup and draw functions, and use the functions from the [p5.js reference](https://p5js.org/reference/) to create images and animations.

Note: In the first studio (PoseNet) project, p5.js functions _had to be prefixed_ with `p5.`: for example, `p5.rect(50, 50, 10, 10)`. In this project, functions must be written _without this prefix_: for example, `rect(50, 50, 10, 10)`.

# After Class

Workshop notes: [part 1](https://codesteps.now.sh/p5-particle-workshop-1/), [part 2](https://codesteps.now.sh/p5-particle-workshop-2/), [page 3](https://codesteps.now.sh/p5-particle-workshop-3/)

## Intended takeaways

-   Practice using _variables_
-   Some examples of when and how to create a _function_
-   Using JavaScript _objects_ to make more than one of a thing
-   Using `forEach` to do the same thing to several objects
-   Using `map` to create several objects
-   Using `Math.floor` and the _modulus_ (`%`) operator to lay out objects
-   Using `Math.random` to add randomness
-   Using `mouseX` and `mouseY` to add interactivity.

Note: Our class projects will not make use of the mouse. The mouse, today, is a stand-in for data that will come from other sources.

-   Configuring a _workspace_ (editor and browser) for productive coding
