---
title: "VS Code Theme Colors"
layout: ../../../../layouts/BaseLayout.astro
---

Customizing VS Code colors to match the p5.js editor aesthetic.

## p5.js Editor Colors

The p5.js web editor uses these signature colors:

-   **Background:** `#1C1C1C` (dark mode)
-   **Pink accent:** `#ED225D`
-   **Light background:** `#FFF` (light mode)

## VS Code Settings

Add to your `settings.json`:

```json
{
  "workbench.colorCustomizations": {
    "activityBar.background": "#ED225D",
    "titleBar.activeBackground": "#ED225D",
    "titleBar.activeForeground": "#FFFFFF"
  }
}
```

## Full Theme

For a complete p5.js-like experience:

```json
{
  "workbench.colorCustomizations": {
    "editor.background": "#1C1C1C",
    "sideBar.background": "#252525",
    "activityBar.background": "#ED225D",
    "activityBar.foreground": "#FFFFFF",
    "titleBar.activeBackground": "#ED225D",
    "statusBar.background": "#ED225D",
    "button.background": "#ED225D"
  }
}
```

## Related

<ul class="page-list"><li><a href="/p5js/vscode/">p5.js in VS Code</a></li><li><a href="/tools/vscode/">VS Code Notes</a></li></ul>
