---
title: "Presenting at an Exhibition"
layout: ../../../layouts/BaseLayout.astro
---

# Setup

- If possible, check out the space in advance. Evaluate:
    - ***Siting***. Find out where your project will be situated.
    - ***Seating.*** Does the viewer need to sit down in order to interact with your project? Is it at the right height for this? Have you provided a chair?
    - ***Standing.*** Does the viewer need to stand up? Is your project at the right height for this?
    - ***Bystanding***. Is there room for other people to watch the interaction? If it is important that they see the same thing as the interactor (screens, or anything else), is this possible?
    - ***Projector***. Do you need a projector? If so, where will it be situated?
    - ***Lighting***. Will the room lights be on or off? Is your laptop or projector screen exposed to indirect or direct sunlight; if so, is it visible in these circumstances? When someone uses your project, will there be direct sunlight or spotlights (say, from other projects) shining in their eyes?
    - ***Sound.*** Does your project require quiet? Is it sited in a place where this can happen? If not, how will you work around this?
- ***Arrive early***. Set up your project – including testing it – *then* wander around. Check back before the show to see whether people have moved your project, or set up obnoxious projects next to it.
- ***Create a Setup Script***. Make a list of everything to bring with you. Make a list of everything you need to do in order to get your project running. Test this script in advance: can you move your project from one place to another, reboot your computer (or start Processing and any other necessary software components – not just count on them still running), and have everything work?
    - ***Create a Test Script.*** This is part of your Setup Script. What are all the different things to test, in order to verify that your project has been set up correctly and that all aspects are working. Take special care to test that any sensors – lighting, sound, distance — work in the new environmental conditions.
- ***Create an Introduction Script.*** Does your project require that you introduce it to each new viewer? Whether it does or not, write out what you will say to visitors. (Then you can throw away what you wrote down. The point is to figure it out in advance, not to read from the same script each time.) Pay attention to these points:
    - *Do not apologize*. Do not explain *why you didn't finish* or *what didn't work*. At least not initially. After the visitor has interacted with the project, then you can discuss the process and details.
    - *Talk about vision and interaction, not about sensors and code*. At least initially. After the visitor has interacted with the project and you have explained your vision, you can discuss technical details if they are interested.
- ***Prepare for contingencies***
    - ***Buy two of everything***. Anything you have one of, will fail.
    - ***Bring tools.*** Usually you want tape and wire.
    - ***Prepare emergency modes***. You should be able to quickly configure each component to do *something*, even if the other components aren't working. For example, if the visuals in your Processing code only run when they receive a certain sensor value, create a way to run them when the sensor is broken. (Ideally, you already created such a mode in order to efficiently test the different components of your code.) For example, a special key to press, or a single line of code that you can change and run the sketch again.

# Full Screen Mode

In Processing, ***present*** your project using *Present* (⇧⌘R), not *Run* (⌘R).

![](/images/presenting-at-an-exhibition/presenting-at-an-exhibition-02.png)

You can also hold down the Shift key while pressing the Play (“Debug”) button, in order to *Present* instead of *Run*.

![](/images/presenting-at-an-exhibition/presenting-at-an-exhibition-01.png)

If your sketch uses `fullScreen()` instead of `size()`, you do not need to do this.

---

©2020–2022 by Oliver Steele.
