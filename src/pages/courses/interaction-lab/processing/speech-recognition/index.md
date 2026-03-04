---
title: "Speech Recognition"
layout: ../../../../../layouts/BaseLayout.astro
---

[

🎶

Oliver’s Notes

](/)

[These instructions](https://florianschulz.info/stt/) by Florian Schulz worked for me.

There is a lot of text on that page, but if you have Processing installed, you only need two steps of setup:

1.  Download and install the Websockets library. In Processing, select Tools > Add Tool; click Libraries; search for Websockets, and install it.
2.  Copy Florian's Processing sketch source code into a new Processing sketch. The Processing source code is the code in the Setup section of the page, that includes the line `import websockets.*;`.

And two steps each time your run the sketch:

1.  Run the Processing sketch. This must happen before you open the page in Chrome. Each time that you restart the Processing code, you need to reload the Chrome page so that it makes a fresh connection to Processing.
2.  Open Florian's Chrome → Processing page [https://codepen.io/getflourish/pen/NpBGqe](https://codepen.io/getflourish/pen/NpBGqe) in Chrome. You must run this code in Chrome, not Safari or another browser.
