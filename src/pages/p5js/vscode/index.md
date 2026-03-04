---
title: "p5.js in VS Code"
layout: ../../../layouts/BaseLayout.astro
---

Setting up Visual Studio Code for p5.js development.

## Recommended Extensions

### Live Server

Launches a local development server with live reload.

1.  Install the "Live Server" extension
2.  Right-click your HTML file
3.  Select "Open with Live Server"

### p5.vscode

Adds p5.js-specific features:

-   Autocomplete for p5.js functions
-   IntelliSense with function documentation
-   Commands to create new p5.js projects

## Project Setup

Create these files in a new folder:

### index.html

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js"></script>
  <script src="sketch.js"></script>
</head>
<body>
</body>
</html>
```

### sketch.js

```javascript
function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}
```

## Type Definitions

For better autocomplete with TypeScript-aware editors:

```bash
npm install @types/p5
```

Or add a reference comment at the top of your sketch:

```javascript
/// <reference types="p5/global" />
```

## Related

<ul class="page-list"><li><a href="/p5js/vscode/visual-studio-theme-color/">VS Code Theme Colors</a></li><li><a href="/p5js/online-p5js-editors/">Online p5.js Editors</a></li><li><a href="/tools/vscode/">VS Code Notes</a></li></ul>
