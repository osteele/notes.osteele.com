---
title: "Arduino"
layout: ../../layouts/BaseLayout.astro
---

Arduino is an open-source electronics platform based on easy-to-use hardware and software.

## Getting Started

The basic Arduino program structure:

<div class="code-example"><pre><code>void setup() {
  // Runs once at startup
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // Runs repeatedly
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}</code></pre></div>

## Related

<ul class="page-list"><li><a href="/physical-computing/">Physical Computing</a></li><li><a href="/raspberry-pi/">Raspberry Pi</a></li></ul>
