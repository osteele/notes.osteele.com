---
title: "Configuring Visual Studio Code for p5.js Development (Live Server)"
layout: ../../../../layouts/BaseLayout.astro
---

![Configuring Visual Studio Code for p5.js Development (Live Server)](https://cdn11.bigcommerce.com/s-86e7d/images/stencil/original/products/100/1077/Paulk_compact_3x6__38397.1524419103.jpg?c=3)

![Configuring Visual Studio Code for p5.js Development (Live Server)](https://ritwickdey.gallerycdn.vsassets.io/extensions/ritwickdey/liveserver/5.6.1/1555497731217/Microsoft.VisualStudio.Services.Icons.Default)

These instructions show how to use Visual Studio Code with the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

The newer, simpler instructions use my [P5 Server extension](https://marketplace.visualstudio.com/items?itemName=osteele.p5-server).

# A. Configure Visual Studio Code

1.  **Install Visual Studio Code**. If you do not already have Visual Studio Code installed, [download](https://code.visualstudio.com/Download) it
2.  **Launch** Visual Studio Code
3.  **Enable Auto Save**

![Verify that ](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f4c86dda-ef55-4b8b-9e5b-9f0d73b9f49c/Untitled/w=1920,quality=90,fit=scale-down)

Verify that _File > Auto Save_ is enabled

5.  **Install Live Server**

![① Open the Extensions panel. ② Search for the “Live Server” extension. ③ Click “Install”.](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/0b1dc516-9036-4c7d-ae33-505a1fc19efd/Untitled/w=1920,quality=90,fit=scale-down)

① Open the Extensions panel. ② Search for the “Live Server” extension. ③ Click “Install”.

7.  **Configure additional settings**. The instructions in the [accompanying slide presentation](https://docs.google.com/presentation/d/1752TdyFIoL2mOFOSzVIZiOlIrLAWEZvBLPR0a62yJaw/edit#slide=id.ga1c9e09f35_3_0) specify how to configure Visual Studio Code to format code whenever you save it, and to disable some of the more annoying autocomplete suggestions.

# B. Create a sketch

1.  Create an HTML file. Create a new file (File > New), paste the following text into it, and save it with the name `index.html`.

Copy

File: `index.html`

3.  Create a JavaScript file. Create a new file, paste the following text into it, and save it with the name `sketch.js`.

Copy

```javascript
function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);
  circle(mouseX, mouseY, 20);
}
```

File: `sketch.js`

# C. Run the sketch in a browser

In Visual Studio Code, click the _Go Live_ button on the lower right corner of the window. (If this button is not present, perhaps you did not install the Live Server extension. Or perhaps you do not have a JavaScript project open in Visual Studio Code.)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2d858d91-c391-475e-bdd9-78f611df7206/Untitled/w=1920,quality=90,fit=scale-down)

This opens the code in Chrome (or your default browser).

# D. Configure Chrome

1\. Chrome (or your preferred browser) should open a tab that displays the sketch. The starter sketch above shows a circle that follows the mouse.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/7776414c-811e-46c3-90df-870a8afba473/Untitled/w=1920,quality=90,fit=scale-down)

2\. Follow [these instructions](https://debugbrowser.com/) to display the JavaScript Console. In Chrome: Open the JavaScript Console: View > Developer Tools > JavaScript Console. Or, press Command+Option+J (Mac) or Control+Shift+J (Windows).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/1a145292-eee4-4e0b-96dd-3155703ff320/Screenshot_of_Google_Chrome_(2019-11-21_1-57-20_PM)/w=1920,quality=90,fit=scale-down)

# E. Arrange your windows

1\. If your screen is big enough, you can configure your desktop so that you can see your source code (in Visual Studio Code) and the drawing (in Chrome) at the same time.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/434531dd-5252-48cb-a605-1cbc4b2413d6/Untitled/w=1920,quality=90,fit=scale-down)

2\. In order to make more space for your editor in Visual Studio Code, you can click the top (Explorer) icon to hide the Explorer side bar.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/363f0786-498b-418d-8b2c-0c8efee9761c/Untitled/w=1920,quality=90,fit=scale-down)

# F. Using Libraries

## p5.Sound

In order to use the p5.Sound library, open the `index.html` file and un-comment this line:

Copy

```html
<!-- <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/addons/p5.sound.min.js" crossorigin="anonymous"></script> -->
```

So that it looks like this:

Copy

```html
<script src="https://cdn.jsdelivr.net/npm/p5@1/lib/addons/p5.sound.min.js" crossorigin="anonymous"></script>
```

## ml5.js

In `index.html`, un-comment this line:

Copy

```html
<!-- <script src="https://unpkg.com/ml5@latest/dist/ml5.min.js"></script> -->
```
