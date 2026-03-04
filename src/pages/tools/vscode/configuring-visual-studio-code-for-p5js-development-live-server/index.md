---
title: "Configuring Visual Studio Code for p5.js Development (Live Server)"
layout: ../../../../layouts/BaseLayout.astro
---

These instructions show how to use Visual Studio Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

The newer, simpler instructions use my [P5 Server extension](https://marketplace.visualstudio.com/items?itemName=osteele.p5-server).

# A. Configure Visual Studio Code

1. **Install Visual Studio Code**. If you do not already have Visual Studio Code installed, [download](https://code.visualstudio.com/Download) it
2. **Launch** Visual Studio Code
3. **Enable Auto Save**
    
    ![Verify that *File > Auto Save* is enabled](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled.png)
    
    Verify that *File > Auto Save* is enabled
    
4. **Install Live Server**
    
    ![① Open the Extensions panel. ② Search for the “Live Server” extension. ③ Click “Install”.](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled 1.png)
    
    ① Open the Extensions panel. ② Search for the “Live Server” extension. ③ Click “Install”.
    
5. **Configure additional settings**. The instructions in the [accompanying slide presentation](https://docs.google.com/presentation/d/1752TdyFIoL2mOFOSzVIZiOlIrLAWEZvBLPR0a62yJaw/edit#slide=id.ga1c9e09f35_3_0) specify how to configure Visual Studio Code to format code whenever you save it, and to disable some of the more annoying autocomplete suggestions.

# B. Create a sketch

1. Create an HTML file. Create a new file (File > New), paste the following text into it, and save it with the name `index.html`.
    
    ```html
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Sketch</title>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
          }
        </style>
      </head>
      <body></body>
    
      <!-- import the javascript library file(s) -->
      <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js" crossorigin="anonymous"></script>
    	<!-- <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/addons/p5.sound.min.js" crossorigin="anonymous"></script> -->
    
      <!-- import the javascript sketch file -->
      <script src="./sketch.js"></script>
    </html>
    ```
    
2. Create a JavaScript file. Create a new file, paste the following text into it, and save it with the name `sketch.js`.
    
    ```jsx
    function setup() {
      createCanvas(windowWidth, windowHeight);
    }
    
    function draw() {
      background(255);
      circle(mouseX, mouseY, 20);
    }
    ```
    

# C. Run the sketch in a browser

In Visual Studio Code, click the *Go Live* button on the lower right corner of the window. (If this button is not present, perhaps you did not install the Live Server extension. Or perhaps you do not have a JavaScript project open in Visual Studio Code.)

![](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled.png)

This opens the code in Chrome (or your default browser).

# D. Configure Chrome

1. Chrome (or your preferred browser) should open a tab that displays the sketch. The starter sketch above shows a circle that follows the mouse.

![](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled 2.png)

2. Follow [these instructions](https://debugbrowser.com/) to display the JavaScript Console.
In Chrome: Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![](/images/configuring-visual-studio-code-for-p5js-development-live-server/Screenshot_of_Google_Chrome_%282019-11-21_1-57-20_PM%29.png)

# E. Arrange your windows

1. If your screen is big enough, you can configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled 3.png)

2. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![](/images/configuring-visual-studio-code-for-p5js-development-live-server/Untitled 4.png)

# F. Using Libraries

## p5.Sound

In order to use the p5.Sound library, open the `index.html` file and un-comment this line:

```html
<!-- <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/addons/p5.sound.min.js" crossorigin="anonymous"></script> -->
```

So that it looks like this:

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1/lib/addons/p5.sound.min.js" crossorigin="anonymous"></script>
```

## ml5.js

In `index.html`, un-comment this line:

```html
<!-- <script src="https://unpkg.com/ml5@latest/dist/ml5.min.js"></script> -->
```
