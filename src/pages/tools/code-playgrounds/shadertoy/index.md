---
title: "Shadertoy"
layout: ../../../../layouts/BaseLayout.astro
---

[shadertoy.com](https://www.shadertoy.com/)

An online community and editor for creating and sharing WebGL shaders.

## Overview

Shadertoy lets you write GLSL fragment shaders that run on the GPU, enabling complex visual effects that would be impossible with traditional CPU-based rendering.

## Key Features

-   Real-time shader preview
-   Built-in inputs: time, mouse, textures, audio
-   Multi-pass rendering support
-   Large community gallery
-   VR mode support

## Getting Started

Basic fragment shader structure:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv.x, uv.y, 0.5, 1.0);
}
```

## Built-in Uniforms

-   `iTime` - Shader playback time
-   `iResolution` - Viewport resolution
-   `iMouse` - Mouse pixel coords
-   `iChannel0-3` - Input textures

## Related

<ul class="page-list"><li><a href="/tools/code-playgrounds/p5js-editor/">p5.js Editor</a></li><li><a href="/tools/code-playgrounds/">All Code Playgrounds</a></li></ul>
