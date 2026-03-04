---
title: "p5.js IMU Workshop"
layout: ../../../layouts/BaseLayout.astro
---

![p5.js IMU Workshop](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/22dea760-bb39-4466-9d1e-6c41d75e369f/bno055-9-dof-absolute-orientation-imu/w=1920,quality=90,fit=scale-down)

During this workshop, you will start from a [p5.js](https://p5js.org) _starter template_. and hook it up to receive IMU data.

_**Goals:**_

-   See an example of using code from a JavaScript library.
-   Gain more familiarity with functions and variables.
-   Use `console.log` to inspect data.
-   Learn to write code that uses data from our sensor data pipeline.
-   Get started on the physical computing aspect of your project.

## A. Create a new p5.js project

I_n this section, you will create a project folder on your disk that includes the index.html and sketch.js files that you need in order to a run a p5 sketch. (These are similar steps to the ones you used in the workshop_ [_Setting up an IMU_](https://docs.google.com/document/d/1yPUTRqMKGiOABynNwFCHbaZC4imIGZ7Kfe25MkFTGWg/edit#heading=h.snzx8skwl0j9)_, except that you've already set up Visual Studio code.)_

1.  Open a new terminal window. (Or, use `cd` to change an existing terminal window to the directory in which you want to create the new project folder; for example, just `cd` to move the terminal to your home direcgtory.)
2.  In the terminal [`git clone https://github.com/osteele/p5-module-template.git imu-workshop`](https://github.com/osteele/p5-module-template.git). This creates a _local folder_ named `imu-workshop`, that has the files for a minimal p5.js sketch.
3.  In Visual Studio Code, open the `imu-workshop` folder.
4.  In Visual Studio Code, click the "Go Live" button.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ba6d8b99-db24-477d-b2fd-baec7ff21dae/Untitled/w=1920,quality=90,fit=scale-down)

5\. Modify `sketch.js` so that something appears on the screen.

## B. Subscribe to sensor data

_We will use the_ _[imu-tools npm package](https://www.npmjs.com/package/imu-tools)_ _to subscribe to IMU data that is coming from the network. This involves adding the imu-tools npm package to our project, so that we can write code that calls functions in this library; and specifying the connection address of a network server._

1\. Follow the instructions on the [imu-tools project page](https://www.npmjs.com/package/imu-tools) to add the package to your project.

Note: You will need to add lines to both `index.html` and `sketch.js`

Note: Complete the instructions in both the _**Usage**_ section and the _**Connection Settings Control Panel**_. of the imu-tools project page.

2\. Enter the MQTT connection settings from [this page](https://docs.google.com/document/d/16tfrlQUlfhclcYJuM4jR2Kbd7K9oLuSkOvZ3CkiaGKw/edit?usp=sharing).

3\. Verify that data is being printed to the JavaScript Console. (In Chrome: View > Developer > JavaScript Console).

## C. Examine the data

Each time a new sample comes from the device, it is printed to the JavaScript console. This is useful because it demonstrates we are receiving a sequence of samples, but it makes it difficult to use the console to inspect any single one of these samples.

We will fix this in these steps.

Note: Rather than giving you code to copy and paste into your sketch, these steps describe the intent and suggest some steps, and leave it to you to construct the exact JavaScript. This is to help you practice some skills in writing code, so that you can apply this to other parts of your project.

1.  `data => console.log('sample', data)` is an _anonymous_ function—it doesn't have a _name_. We will replace this by a new _named function_ that does the same thing. Let's name the new function `handleSensorData`. (As with a variable, the actual name doesn't matter, so long as we use the same name when we _define_ the function and when we _use_ it.) Use `function` to define a function with parameter `data`, that calls `console.log` in the function body.
2.  Introduce a _global variable_ (a variable that is defined outside of any `function`), that keeps track of whether this is the first time that `handleSensorData` has been run.

-   Pick a name for the variable, and use a `let` statement to define the variable and initialize it to `false`.
-   Modify `handleSensorData` to change the variable's value to `true`.

4.  Finally, add an `if` statement to the function so that it only runs `console.log` the first time it is run.
5.  Now, the sketch should only print the sample data once. Inspect this value in the JavaScript console.

## D. “Zoom into” the data

The sensor data is a JavaScript object with a a number of properties. Many of these properties are arrays. We'll use this fact to review how to read a single property value from an object, and a single value from an array of values.

1.  Modify the call to `console.log` to print just the orientation data. (The orientation data is in the property named `euler`.) Move the IMU, and observe how this value changes.
2.  The value of the `euler` property is an array of yaw, pitch, and roll. Modify the code in the call to `console.log` to print just one of these.

## E. Use the sensor data in the sketch

In order to make use of the IMU data in a sketch, we'll introduce another global variable. The function called by `onSensorData` stores the sensor data into this value, and the `sketch` function reads from it.

1.  Choose a variable name. Define a global variable with this name, and initialize it to `null`. (This special value represents the idea that “we don't yet have a meaningful value”.)
2.  Modify `handleSensorData` to set this variable to the latest sample data. (You can decide whether the variable is set to the entire sample, just the orientation array, or a single value from the orientation array.)
3.  Modify `draw` to make use of the value. The drawing should do something that depends on the value.

Suggestion: Use the p5.js [rotate](https://p5js.org/reference/#/p5/rotate) function to rotate a shape or image according to the value of one of the sensor readings. You will run into two challenges: (1) The sensor's Euler angles are in degrees, while the `rotate` function expects angles in radians. (2) p5.js rotation is around the upper left corner, at (0, 0). In order to rotate around a different point, you will need to use the `translate` function.

Note: Code that attempts to access the data may produce an error or unexpected results if it is run before the first sample arrives from the IMU. You can avoid this issue by testing whether the data is null; for example: `if (…variable name… !== null) { …your code here… }`.
