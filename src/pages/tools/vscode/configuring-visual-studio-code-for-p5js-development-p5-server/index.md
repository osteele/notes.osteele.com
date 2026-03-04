---
title: "Configuring Visual Studio Code for p5.js Development with the P5 Server extension"
layout: ../../../../layouts/BaseLayout.astro
---

These instructions show how to use Visual Studio Code with the [P5 Server extension](https://marketplace.visualstudio.com/items?itemName=osteele.p5-server). The older instructions show how to use Visual Studio Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and a starter project on GitHub.

# A. Download Visual Studio Code

1. **Install Visual Studio Code**. If you do not already have Visual Studio Code installed, [download](https://code.visualstudio.com/Download) it
2. **Launch** Visual Studio Code
3. **Enable Auto Save**
    
    ![Verify that File > Auto Save is enabled](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled.png)
    
    Verify that File > Auto Save is enabled
    
4. **Install the P5 Server extension**
    
    ![① Open the Extensions panel. ② Search for the “P5 Server” extension. ③ Click “Install”.](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Install_extensions.png)
    
    ① Open the Extensions panel. ② Search for the “P5 Server” extension. ③ Click “Install”.
    
5. **Configure additional settings**. The instructions in the [accompanying slide presentation](https://docs.google.com/presentation/d/1752TdyFIoL2mOFOSzVIZiOlIrLAWEZvBLPR0a62yJaw/edit#slide=id.ga1c9e09f35_3_0) specify how to configure Visual Studio Code to format code whenever you save it, and to disable some of the more annoying autocomplete suggestions.

# B. Create a sketch

In Visual Studio Code, open (or create) a new folder. Click on the P5 icon (the star) in the action strip on the left. Click New Sketch, and choose a name for your sketch.D. Run the sketch in Chrome (or Safari or Edge).

![1. In Visual Studio Code, open a folder from your disk. This is the folder where you will keep your sketch (or sketches). You can create a new folder for this. I have one called “Sketches”, where I keep a collection of small sketches. Larger projects might get their own folder. (You can move files between folders later.)](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled.png)

1. In Visual Studio Code, open a folder from your disk. This is the folder where you will keep your sketch (or sketches). You can create a new folder for this. I have one called “Sketches”, where I keep a collection of small sketches. Larger projects might get their own folder. (You can move files between folders later.)

![2. Once you have opened a folder, click on the P5 icon (the star) in the action bar on the left. This opens up a list of sketches in the folder. (There might be more than one file per sketch, such as when a sketch includes both an HTML file and a JavaScript file, or loads some images or audio resources.) With a new folder, there aren't any.](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 1.png)

2. Once you have opened a folder, click on the P5 icon (the star) in the action bar on the left. This opens up a list of sketches in the folder. (There might be more than one file per sketch, such as when a sketch includes both an HTML file and a JavaScript file, or loads some images or audio resources.) With a new folder, there aren't any.

![3. Click Create p5.js Sketch File. (You can also click the + icon at the top of the pane.)](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 1.png)

3. Click Create p5.js Sketch File. (You can also click the + icon at the top of the pane.)

![4. Pick a name for your sketch. You don't have to be very imaginative — you can rename it later. I often name my sketches something like “my sketch”, “sketch 1”, “Thursday”, or “circles”. The ones that I don't throw away, it often becomes clear what they should be called after I work on them for a while. (Remember this principle. It is often true of variable names and function names too, if you are working in an editor such as Visual Studio code that allows you to rename these easily.)](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 2.png)

4. Pick a name for your sketch. You don't have to be very imaginative — you can rename it later. I often name my sketches something like “my sketch”, “sketch 1”, “Thursday”, or “circles”. The ones that I don't throw away, it often becomes clear what they should be called after I work on them for a while. (Remember this principle. It is often true of variable names and function names too, if you are working in an editor such as Visual Studio code that allows you to rename these easily.)

![5. Now the left pane (the P5 Sketch Explorer) has been updated with a list of sketches in the folder, and the right pane shows the sketch that you created.](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 3.png)

5. Now the left pane (the P5 Sketch Explorer) has been updated with a list of sketches in the folder, and the right pane shows the sketch that you created.

# C. Run the sketch

Open your sketch, so that its source code is showing in an editor pane. Click the globe icon in the upper right corner of the editor window.

![two-panes.png](/images/configuring-visual-studio-code-for-p5js-development-p5-server/two-panes.png)

This runs the sketch in a new pane to the right of the editor pane.

![Untitled](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 4.png)

Click on the P5 icon in the action bar to hide the Sketch Explorer pane. This gives more room for your code and sketch.

![Untitled](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 5.png)

# D. Run the sketch in Chrome (or Safari or Edge)

For more advanced development, or in order to use the webcam, you will need to run your sketch in a browser instead of inside visual Studio Code.

If you have a sketch running in Visual Studio Code, you can click the *Open in Browser* button to run it in your default browser.

![popuut button.png](/images/configuring-visual-studio-code-for-p5js-development-p5-server/popuut_button.png)

To make the P5 Server extension always open sketches in a separate browser: open the Visual Studio Code preferences, search for “P5 Server”, and change the Browser setting to “chrome”, “safari”, or “edge”.

![Untitled](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 6.png)

# E. Configure Chrome for JavaScript development

1. Chrome (or your preferred browser) should open a tab that displays the sketch. (The current sketch is blank.)

![](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 2.png)

2. Follow [these instructions](https://debugbrowser.com/) to display the JavaScript Console.
In Chrome: Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Screenshot_of_Google_Chrome_%282019-11-21_1-57-20_PM%29.png)

# F. Arrange your windows

1. If your screen is big enough, you can configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 3.png)

2. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![](/images/configuring-visual-studio-code-for-p5js-development-p5-server/Untitled 4.png)
