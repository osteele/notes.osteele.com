---
title: "Building Small macOS Apps with SwiftPM"
layout: ../../layouts/BaseLayout.astro
---

Give your coding agent this prompt:

```text
Install just and the Xcode command-line tools, and create a macOS application that [ONE-SENTENCE DESCRIPTION]. Use https://github.com/osteele/macos-swiftpm-app-template as a template.
```

You can also specify a project name. Otherwise, the agent will choose one.

The [SwiftPM macOS App
Template](https://github.com/osteele/macos-swiftpm-app-template) creates a
small macOS app without an Xcode project. Swift Package Manager builds the
program, and a short script puts the program, settings, and resources into a
standard `.app` bundle.

I use this setup for apps that I distribute directly or install on my own
machines. Most of the interface uses SwiftUI. AppKit handles Mac features that
SwiftUI does not cover. A [`justfile`](https://just.systems/) contains the
commands to build, install, sign, and notarize the app.

## What is in the template

The template is based on four Swift applications in my `~/code/apps`
directory:

- **AgentView** is a small SwiftUI window app with a separate library for code
  that does not depend on the interface.
- **Weft Status** is a menu-bar app. Its `Info.plist` uses `LSUIElement` to
  keep it out of the Dock.
- **Research Rounds** combines a SwiftUI app, a core library, a command-line
  tool, and a small test program in one package.
- **[Typeset Viewer](https://typeset.osteele.com/)** uses AppKit to manage
  documents, file-open events, windows, tabs, menus, and PDFKit. It can also
  run commands without opening a window. Its release process includes
  Developer ID signing, notarization, and Sparkle updates.

The applications use the same basic files and build steps:

| Part | Template choice |
| --- | --- |
| Package | One Swift package, usually with an app and a shared library |
| UI | SwiftUI for views and AppKit for Mac features that SwiftUI does not provide |
| App settings | A checked-in `App/Info.plist` |
| Build commands | A `justfile` contains the commands people and coding agents run |
| Bundle | The built program goes in `Contents/MacOS` |
| Resources | The build script copies resources into `Contents/Resources` |
| Development install | The build script copies the app into `~/Applications` and registers it with Launch Services |
| Checks | A small test program plus a release build |
| Release | Developer ID signing, Apple notarization, and a zip file |

A small test program works in command-line Swift environments where `XCTest`
is not available. Run it with `swift run ProductChecks`. Projects that can use
`XCTest` can add ordinary SwiftPM test targets instead or as well.

## SwiftUI and AppKit

Most apps start with a SwiftUI `App` and a `WindowGroup`:

```swift
@main
struct MyApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }

        Settings {
            SettingsView()
        }
    }
}
```

`NSApplicationDelegateAdaptor` lets an app delegate respond to events such as
launch and reopen while SwiftUI continues to create the windows. A menu-bar
utility can replace `WindowGroup` with `MenuBarExtra` and set `LSUIElement` in
its plist.

Some apps need AppKit to create and manage the application windows. File
viewers and document apps sometimes need `NSDocument`, control over how files
open, saved tabs, or menus that follow the active document. In that case, the
program can create `NSApplication` and place SwiftUI views inside AppKit
windows. SwiftPM and the build commands do not need to change.

## Commands

Install the application with:

```sh
just install
```

Run `just` to see the other recipes.

The `app` command creates the standard bundle directories, copies the program
under the application name, installs `Info.plist` and the icon, and writes
`PkgInfo`. Finder and Launch Services then recognize the result as a macOS
application.

`Info.plist` stores the display name, program name, bundle identifier, version,
minimum system version, supported document types, URL schemes, and whether the
app appears in the Dock. A version command updates this file, so the version
does not also need to be stored in Swift code.

## Development and release

A development build does not require an Apple Developer account or release
credentials. Publishing outside the Mac App Store requires the [Apple
Developer Program](https://developer.apple.com/programs/). Ask your coding
agent how to set it up.

Publishing outside the Mac App Store adds these steps:

1. Build the release app.
2. Sign each included framework, helper program, and service.
3. Sign the outer app with a Developer ID Application identity, a secure
   timestamp, and hardened runtime.
4. Send a zip file to Apple with `notarytool`.
5. Attach Apple's approval ticket to the app and check the result.
6. Create the zip file for download.

Apple describes this process in [Notarizing macOS software before
distribution](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution).
The template includes these steps for an app that contains only its main
program. An app that includes Sparkle, helper programs, XPC services, or other
frameworks must sign those parts before it signs the app itself.

## Limitations

Use this approach for small utilities, menu-bar apps, local dashboards, and
document tools that you distribute outside the Mac App Store. It also works
for an app that shares code with a command-line tool.

The template's bundle script is specific to macOS. A Swift package can still
contain code shared with iOS and iPadOS, but use an Xcode project for the phone
and tablet apps. Xcode selects the correct SDK, signs the apps, runs them in
the Simulator, and installs them on devices. Apple's [Xcode project
guide](https://developer.apple.com/documentation/xcode/creating-an-xcode-project-for-an-app)
explains how to create apps for one or more Apple platforms.

An app built from this template can use Quick Look to display supported files
inside its own window. To add Finder previews or thumbnails for a custom file
type, the app needs a Quick Look extension. Apple creates this as a separate
Xcode target and build scheme in [Providing Thumbnails of Your Custom File
Types](https://developer.apple.com/documentation/quicklookthumbnailing/providing-thumbnails-of-your-custom-file-types).
Use an Xcode app project for an app that includes this extension.

Also use an Xcode project for App Store distribution, App Sandbox settings,
iCloud containers, app extensions, system extensions, advanced permission
settings called entitlements, or assets and translations managed by Xcode.
Apple documents the App Store sandbox requirement in [Configuring the macOS App
Sandbox](https://developer.apple.com/documentation/xcode/configuring-the-macos-app-sandbox).
