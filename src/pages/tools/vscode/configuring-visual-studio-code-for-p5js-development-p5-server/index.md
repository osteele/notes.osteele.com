---
title: "Configuring Visual Studio Code for p5.js Development with the P5 Server extension"
layout: ../../../../layouts/BaseLayout.astro
---

![Configuring Visual Studio Code for p5.js Development with the P5 Server extension](https://cdn11.bigcommerce.com/s-86e7d/images/stencil/original/products/100/1077/Paulk_compact_3x6__38397.1524419103.jpg?c=3)

![Configuring Visual Studio Code for p5.js Development with the P5 Server extension](https://osteele.gallerycdn.vsassets.io/extensions/osteele/p5-server/1.1.0/1631683723491/Microsoft.VisualStudio.Services.Icons.Default)

These instructions show how to use Visual Studio Code with the [P5 Server extension](https://marketplace.visualstudio.com/items?itemName=osteele.p5-server). The older instructions show how to use Visual Studio Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) and a starter project on GitHub.

# A. Download Visual Studio Code

1.  **Install Visual Studio Code**. If you do not already have Visual Studio Code installed, [download](https://code.visualstudio.com/Download) it
2.  **Launch** Visual Studio Code
3.  **Enable Auto Save**

![Verify that File > Auto Save is enabled](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/9ed9ba06-2111-4a83-8f4e-11d17172b0a1/Untitled/w=1920,quality=90,fit=scale-down)

Verify that File > Auto Save is enabled

5.  **Install the P5 Server extension**

![① Open the Extensions panel. ② Search for the “P5 Server” extension. ③ Click “Install”.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6fce32cb-aab3-4658-96bd-de99ccf54b5e/Install_extensions/w=1920,quality=90,fit=scale-down)

① Open the Extensions panel. ② Search for the “P5 Server” extension. ③ Click “Install”.

7.  **Configure additional settings**. The instructions in the [accompanying slide presentation](https://docs.google.com/presentation/d/1752TdyFIoL2mOFOSzVIZiOlIrLAWEZvBLPR0a62yJaw/edit#slide=id.ga1c9e09f35_3_0) specify how to configure Visual Studio Code to format code whenever you save it, and to disable some of the more annoying autocomplete suggestions.

# B. Create a sketch

In Visual Studio Code, open (or create) a new folder. Click on the P5 icon (the star) in the action strip on the left. Click New Sketch, and choose a name for your sketch.D. Run the sketch in Chrome (or Safari or Edge).

![1. In Visual Studio Code, open a folder from your disk. This is the folder where you will keep your sketch (or sketches). You can create a new folder for this. I have one called “Sketches”, where I keep a collection of small sketches. Larger projects might get their own folder. (You can move files between folders later.)](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/7a9af8de-e0d9-4481-93cc-bb36551e9872/Untitled/w=1920,quality=90,fit=scale-down)

1\. In Visual Studio Code, open a folder from your disk. This is the folder where you will keep your sketch (or sketches). You can create a new folder for this. I have one called “Sketches”, where I keep a collection of small sketches. Larger projects might get their own folder. (You can move files between folders later.)

![2. Once you have opened a folder, click on the P5 icon (the star) in the action bar on the left. This opens up a list of sketches in the folder. (There might be more than one file per sketch, such as when a sketch includes both an HTML file and a JavaScript file, or loads some images or audio resources.) With a new folder, there aren't any.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/984d6c72-3b95-4bd7-b766-31cf547f86af/Untitled/w=1920,quality=90,fit=scale-down)

2\. Once you have opened a folder, click on the P5 icon (the star) in the action bar on the left. This opens up a list of sketches in the folder. (There might be more than one file per sketch, such as when a sketch includes both an HTML file and a JavaScript file, or loads some images or audio resources.) With a new folder, there aren't any.

![3. Click Create p5.js Sketch File. (You can also click the + icon at the top of the pane.)](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e10c1b71-f094-4d21-a1bd-6f0cf877085d/Untitled/w=1920,quality=90,fit=scale-down)

3\. Click Create p5.js Sketch File. (You can also click the + icon at the top of the pane.)

![4. Pick a name for your sketch. You don't have to be very imaginative — you can rename it later. I often name my sketches something like “my sketch”, “sketch 1”, “Thursday”, or “circles”. The ones that I don't throw away, it often becomes clear what they should be called after I work on them for a while. (Remember this principle. It is often true of variable names and function names too, if you are working in an editor such as Visual Studio code that allows you to rename these easily.)](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/3b123b47-1c6d-4d83-b153-70b0d9545b8e/Untitled/w=1920,quality=90,fit=scale-down)

4\. Pick a name for your sketch. You don't have to be very imaginative — you can rename it later. I often name my sketches something like “my sketch”, “sketch 1”, “Thursday”, or “circles”. The ones that I don't throw away, it often becomes clear what they should be called after I work on them for a while. (Remember this principle. It is often true of variable names and function names too, if you are working in an editor such as Visual Studio code that allows you to rename these easily.)

![5. Now the left pane (the P5 Sketch Explorer) has been updated with a list of sketches in the folder, and the right pane shows the sketch that you created.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b37918ac-df7e-45de-a29b-5f02b1452e5d/Untitled/w=1920,quality=90,fit=scale-down)

5\. Now the left pane (the P5 Sketch Explorer) has been updated with a list of sketches in the folder, and the right pane shows the sketch that you created.

# C. Run the sketch

Open your sketch, so that its source code is showing in an editor pane. Click the globe icon in the upper right corner of the editor window.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/bec02276-00e8-44c6-b647-f5f31aaccd70/two-panes/w=1920,quality=90,fit=scale-down)

This runs the sketch in a new pane to the right of the editor pane.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2178f1ca-f958-4c69-b818-efcad58301c3/Untitled/w=1920,quality=90,fit=scale-down)

Click on the P5 icon in the action bar to hide the Sketch Explorer pane. This gives more room for your code and sketch.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ac247d2a-bafb-4251-badf-26fbec5f00dc/Untitled/w=1920,quality=90,fit=scale-down)

# D. Run the sketch in Chrome (or Safari or Edge)

For more advanced development, or in order to use the webcam, you will need to run your sketch in a browser instead of inside visual Studio Code.

If you have a sketch running in Visual Studio Code, you can click the _Open in Browser_ button to run it in your default browser.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/74252e43-b5d0-4c6d-8c57-1a64fa10b6d0/popuut_button/w=1920,quality=90,fit=scale-down)

To make the P5 Server extension always open sketches in a separate browser: open the Visual Studio Code preferences, search for “P5 Server”, and change the Browser setting to “chrome”, “safari”, or “edge”.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/3d869238-f6da-4a54-98b9-3c3f26115753/Untitled/w=1920,quality=90,fit=scale-down)

# E. Configure Chrome for JavaScript development

1\. Chrome (or your preferred browser) should open a tab that displays the sketch. (The current sketch is blank.)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/bf623513-d002-4cdb-9098-53213f9d381a/Untitled/w=1920,quality=90,fit=scale-down)

2\. Follow [these instructions](https://debugbrowser.com/) to display the JavaScript Console. In Chrome: Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b19887fb-f95b-4f45-a53a-8ff5f1022ba2/Screenshot_of_Google_Chrome_(2019-11-21_1-57-20_PM)/w=1920,quality=90,fit=scale-down)

# F. Arrange your windows

1\. If your screen is big enough, you can configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/a84d9a1d-0188-4d17-94ce-2c5b49facc0a/Untitled/w=1920,quality=90,fit=scale-down)

2\. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/36b64486-9d94-4623-9a1b-81573957dfa6/Untitled/w=1920,quality=90,fit=scale-down)
