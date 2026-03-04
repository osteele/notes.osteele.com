---
title: "Visual Studio Code for Presentations"
layout: ../../../../layouts/BaseLayout.astro
---

# Presentation Profile

Use the following alias to launch VSCode with a distinct Profile for presentations. You can use this to launch without extensions and other customizations, in order to present a simpler mode that looks like what students will see. For example, I like to code with ligatures, but this is very confusing.

Copy

```shell
function codi() {
  local dir=~/.vscode-teaching
  if [[ ! -d $dir ]]; then
    echo "Creating $dir"
    mkdir -p "$dir"
  fi
  code --extensions-dir "$dir/extensions" --user-data-dir "$dir/data"
}
```

Delete the `~/.vscode-teaching` directory (while VSCode is not running) in order to reset the profile. Or place it under version control, in order to reset it to a saved configuration — for example, one that uses the Settings below.

There are VSCode Extensions that do this, but I have found them slow and unreliable.

`codi` stands for “Visual Studio Code in Instruction mode”.

You can run a VSCode instance with this profile side-by-side with a Visual Studio Code that is running the default profile, but they will have the same icon.

## Launch Shortcuts

I generally launch this from Alfred keyword, rather than from the terminal. If you do this, use an absolute path e.g. `/usr/local/bin/code` instead of just `code` as above.

You can also use Automator to make it look like an app. Then the workflow for launching it will look the same as for students. (I have given it a different name and icon, but you can of course replace these.)

[

Visual Studio Code (presentation).app.zip2947.9KB

](https://assets.super.so/69ceaa36-3dbd-448e-a6f1-948727642c5c/files/1d4a6b2c-ce40-4282-b817-829c647e2fef.zip)

# Settings

[Visual Studio Code's Screencast Mode](https://code.visualstudio.com/updates/v1_31#_screencast-mode) shows clicks and keypress. Configure it to only show only keyboard shortcuts, and place them lower on the screen:

**Screencast Mode: Only Keyboard Shortcuts** → true **Screencast Mode: Vertical Offset** → 2 (e.g.)

Other useful setting overrides for presentations:

**Editor: Font Size** **Window: Zoom Level**

Not specific to presentations: I generally instruct students to install the following extension:

-   [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

and override the following settings:

**Files: Auto Save** → onFocusChange **Editor: Format on Save** → enabled **Files: Insert Final Newline** → enabled **Files: Trim Final Newlines** → enabled **Files: Trim Trailing Whitespace** → enabled **JavaScript > Suggest** → disabled **Live Server > Settings: Custom Browser** → chrome
