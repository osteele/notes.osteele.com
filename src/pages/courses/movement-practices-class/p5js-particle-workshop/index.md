---
title: "p5.js Particle Workshop"
layout: ../../../../layouts/BaseLayout.astro
---

During this workshop, you will *start from* an empty [p5.js](https://p5js.org) web page and *progress through* a series of “particle systems” animations.

The goal of this workshop is to help you become aware of some of the tools and techniques that are available in JavaScript and in p5.js, and to practice some of the element of a productive programming workflow. You might never write your own particle system after this workshop! (There are libraries for this, for p5.js and for other platforms.) Rather, the things that we practice today will be useful to you in your programming in general, and can be applied to coding other parts of your project (and to programming outside this course).

You are not expected to remember exactly how to use everything that appears on the screen. Instead, now that you have seen that they exist, you can ask the instructors and others how to do a thing, when you recognize that it may be useful in your own work. Also, after class we will post the code that was used today, so that you can refer back to it.

# Set up your workspace

The instructions for configuring Visual Studio Code and Chrome for web development have moved [here](/p5js/vscode/).

## A. Configure Visual Studio Code

1. Launch Visual Studio Code.
2. Verify that File > Auto Save is enabled:
    
    ![](/images/p5js-particle-workshop/Untitled.png)
    

3. Open the Extensions panel ①. Search for the “Live Server” extension ②. Install it ③.

![](/images/p5js-particle-workshop/Untitled 1.png)

## B. Download the project starter kit

1. In a terminal, run `git clone https://github.com/osteele/p5-particle-workshop.git` 
2. In Visual Studio Code, open the `p5-particle-workshop`
3. In Visual Studio Code, open the `sketch.js` file.
4. In Visual Studio Code, click the Go Live button

![](/images/p5js-particle-workshop/Untitled.png)

## C. Configure Chrome

1. Chrome (or your preferred browser) should open a tab that displays the sketch. (The current sketch is blank.)

![](/images/p5js-particle-workshop/Untitled 2.png)

2. Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![](/images/p5js-particle-workshop/Screenshot_of_Google_Chrome_%282019-11-21_1-57-20_PM%29.png)

## D. Arrange your windows

1. Configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![](/images/p5js-particle-workshop/Untitled 3.png)

2. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![](/images/p5js-particle-workshop/Untitled 4.png)

# Live Coding

Now follow along as we create setup and draw functions, and use the functions from the [p5.js reference](https://p5js.org/reference/) to create images and animations.

Note: In the first studio (PoseNet) project, p5.js functions *had to be prefixed* with `p5.`:  for example, `p5.rect(50, 50, 10, 10)`. In this project, functions must be written *without this prefix*: for example, `rect(50, 50, 10, 10)`.

# After Class

Workshop notes: [part 1](https://codesteps.now.sh/p5-particle-workshop-1/), [part 2](https://codesteps.now.sh/p5-particle-workshop-2/), [page 3](https://codesteps.now.sh/p5-particle-workshop-3/)

## Intended takeaways

- Practice using *variables*
- Some examples of when and how to create a *function*
- Using JavaScript *objects* to make more than one of a thing
- Using `forEach` to do the same thing to several objects
- Using `map` to create several objects
- Using `Math.floor` and the *modulus* (`%`) operator to lay out objects
- Using `Math.random` to add randomness
- Using `mouseX` and `mouseY` to add interactivity.
    
    Note: Our class projects will not make use of the mouse. The mouse, today, is a stand-in for data that will come from other sources.
    
- Configuring a *workspace* (editor and browser) for productive coding
