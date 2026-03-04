---
title: "Presenting at an Exhibition"
layout: ../../../layouts/BaseLayout.astro
---

# Setup

-   If possible, check out the space in advance. Evaluate:

-   _**Siting**_. Find out where your project will be situated.
-   _**Seating.**_ Does the viewer need to sit down in order to interact with your project? Is it at the right height for this? Have you provided a chair?
-   _**Standing.**_ Does the viewer need to stand up? Is your project at the right height for this?
-   _**Bystanding**_. Is there room for other people to watch the interaction? If it is important that they see the same thing as the interactor (screens, or anything else), is this possible?
-   _**Projector**_. Do you need a projector? If so, where will it be situated?
-   _**Lighting**_. Will the room lights be on or off? Is your laptop or projector screen exposed to indirect or direct sunlight; if so, is it visible in these circumstances? When someone uses your project, will there be direct sunlight or spotlights (say, from other projects) shining in their eyes?
-   _**Sound.**_ Does your project require quiet? Is it sited in a place where this can happen? If not, how will you work around this?

-   _**Arrive early**_. Set up your project – including testing it – _then_ wander around. Check back before the show to see whether people have moved your project, or set up obnoxious projects next to it.
-   _**Create a Setup Script**_. Make a list of everything to bring with you. Make a list of everything you need to do in order to get your project running. Test this script in advance: can you move your project from one place to another, reboot your computer (or start Processing and any other necessary software components – not just count on them still running), and have everything work?

-   _**Create a Test Script.**_ This is part of your Setup Script. What are all the different things to test, in order to verify that your project has been set up correctly and that all aspects are working. Take special care to test that any sensors – lighting, sound, distance — work in the new environmental conditions.

-   _**Create an Introduction Script.**_ Does your project require that you introduce it to each new viewer? Whether it does or not, write out what you will say to visitors. (Then you can throw away what you wrote down. The point is to figure it out in advance, not to read from the same script each time.) Pay attention to these points:

-   _Do not apologize_. Do not explain _why you didn't finish_ or _what didn't work_. At least not initially. After the visitor has interacted with the project, then you can discuss the process and details.
-   _Talk about vision and interaction, not about sensors and code_. At least initially. After the visitor has interacted with the project and you have explained your vision, you can discuss technical details if they are interested.

-   _**Prepare for contingencies**_

-   _**Buy two of everything**_. Anything you have one of, will fail.
-   _**Bring tools.**_ Usually you want tape and wire.
-   _**Prepare emergency modes**_. You should be able to quickly configure each component to do _something_, even if the other components aren't working. For example, if the visuals in your Processing code only run when they receive a certain sensor value, create a way to run them when the sensor is broken. (Ideally, you already created such a mode in order to efficiently test the different components of your code.) For example, a special key to press, or a single line of code that you can change and run the sketch again.

# Full Screen Mode

In Processing, _**present**_ your project using _Present_ (⇧⌘R), not _Run_ (⌘R).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e9832411-27bf-48e2-b8fc-229950f0bad9/Untitled/w=1920,quality=90,fit=scale-down)

You can also hold down the Shift key while pressing the Play (“Debug”) button, in order to _Present_ instead of _Run_.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4618917d-c9c4-482e-b736-1460a7223f6e/Untitled/w=1920,quality=90,fit=scale-down)

If your sketch uses `fullScreen()` instead of `size()`, you do not need to do this.

©2020–2022 by Oliver Steele.
