---
title: "Collaboration Tips"
layout: ../../../../layouts/BaseLayout.astro
---

**Note**: This was written as a reminder for instructors, who are already familiar with these techniques, to refer to while advising students. It is long on general advice and short on examples. It *may* be useful to students as well, who are willing to put some work into reading it and are willing to then check with an instructor or other advisor (such as a more experienced student) once they have a tentative plan.

**Note**: Some of this advice applies to projects, or engineering projects, or software projects, in general. Some of it is specific to physical computing or the Arduino.

Alternatives for how students can work together remotely:

- Divide the project into pieces (***components***); each do some of them. There’s an art to dividing a project into pieces that can be done separately, and it’s especially difficult if you haven’t done a lot of projects before. There’s more on this below, but it’s good to run your work plan proposal by an instructor or other advisor.
- Use ***collaboration tools***, so that you can work on the same component together on one screen. See the section below, on ***Collaborating on Code***.
- It’s often nice to ***combine these techniques*** and/or ***switch back and forth between them***. For example, work on a component alone while your partner works on another component, but switch to working on the same thing together: if one of you gets stuck, or to give each other feedback and fresh ideas, or to make sure both of you get more learning out of the project.

# Separating **a project into components**

- A larger project can be broken down into an ordered list of tasks. Each person takes a new task from the list, when they’ve completed the one they were working on.
- An *easy* way to divide a project is by fabrication technique; for example, code vs circuit vs fabrication of housing or enclosure, etc. This may be enough, especially with a short project and a small team, and if you have distinct learning objectives (you aren’t both trying to learn about coding, and you aren’t both being *assessed* on coding).
- If your project has [*stages*](/physical-computing/arduino/multi-stage-sketches/) or *levels* (it offers one set of interactions and behaviors at one time, and another at a different time), sometimes each stage can be developed as a separate component. (If the stages have common functionality, this requires a different technique or extra coordination. For example, this technique wouldn’t be useful for the initial development of a platform game, where the levels differ only in the arrangement of walls and obstacles.)
- During development, it is common to ***stub*** a piece of functionality – use a *stand-in* that is much easier to build, even if it doesn’t have the required functionality or fit or polish. This is especially helpful when dividing a project.
- Figuring out how to divide a project into components, in order to *plan the fabrication*, is itself work. A lot of it is work that you would have to do at some point anyway, in order to *perform the fabrication*. If you haven’t done many projects before, you might get stuck trying to figure out *how the components can be divided* before you actually *construct the components*. Recognize the limits of this approach; and that these limits might be different for your second or fifth or tenth project than for your first.

# Separating an Arduino Sketch

Thoughts on ***dividing the coding part*** of an Arduino project into pieces:

- If the sketch can be divided into pieces that use different *physical components* (different sensors and/or outputs), one student can work on the code that uses one sensor or output, and the other on code that uses another sensor or output
- You can ***simulate a sensor*** you don’t have by using a button. For example, if the device is supposed to run a fan in a certain way when the user waves their hands in front of a detector and you’re responsible for running the fan, make it happen when the sketch starts or when the user presses a button.
- You can ***simulate an output*** that you don’t have have by using an LED. For example, if the device is supposed to run a fan in a certain way when the user waves their hands in front of a detector and you’re responsible for detecting when the user has waved their hands in the right way, flash the LED into of running the fan.

**Integration hell** refers to the difficulty of taking separately-developed pieces and getting them to work together. If you divide up your work, it is important to frequently and early practice combining the pieces. Integration failure is the most common failure mode of a team project with separately-developed components.

Note that dividing a project into pieces is useful even if you are not forced to work remotely from your team mate. Then you can both be working on things at the same time.

Note that dividing a project into pieces is useful even if you are not working on a team. Then you can develop (and more importantly, debug) one part of in isolation. Then there is is less to create before you can test any of it, and when there is a problem there are fewer places to look.

# Collaborating on Code

## Screen sharing

One way to collaborate on code is to work on the same code at the same time, by having it “live” on one person’s computer and sharing that computer with the other team member(s).

Zoom is good for one-way screen sharing (where one person shares their screen for the other person to see, but not control). Zoom implement two-way screen control as well, but on a slower connection it doesn’t work as well as…

[https://screen.so](https://screen.so/) is better than Zoom at sharing control of a screen (so you can both type).

For Arduino code, the Tinkercad simulator probably makes it easier to collaborate.

Note: For web development there are other possibilities. So if you take a course such as Creative Coding that involves web development or server development, you will have the opportunity to use other collaboration tools that can work better than the ones described here.

## Sending Code back and Forth

The other way to collaborate on code is to send lines of code or files back and forth.

Slack is particularly good at *talking about* code, as well as sending snippets of code back and forth. Surround a word by backticks ` to quote it as code e.g. `function setup()`. Start a line with three backticks ``` to paste in a multi-line sketch or fragment of a sketch, to preserve its code formatting.

Git, GitHub, and GitHub Desktop automate this, so that it is easier to share new versions and to see what has changed since the previous version. They can be used with the Arduino and Processing IDEs. Although git is easier to use once a project has been set up with it (especially using GitHub Desktop), it is more difficult to set up a project so that you and your team members have access to it, and is beyond the scope of this course.
