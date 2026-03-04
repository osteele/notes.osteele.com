---
title: "Particle Ports"
layout: ../../../../layouts/BaseLayout.astro
---

Particle.js with scalars, and with the `class` keyword.

Step 1 is a rewrite of particle.js to use pairs of scalar values (x and y, each with a value that is a Number), instead of p5 Vectors.

This is more verbose, and also easier to understand. I recommend this style if you are new to p5, or because it is fewer concepts to understand and because it is clear to extend it to, say, three dimensions or to use this technique in other frameworks (JavaScript *without* p5.js) or languages. I recommend using Vector if you are a power user, or already understand it, because it is a more direct map to the way a mathematician or physicist would express this in equations, and because there is less redundancy and therefore fewer chances to make typos.

Step 2 refactors the code to use a JavaScript class.
