---
title: "PoseNet Data Solution Set"
layout: ../../../../layouts/BaseLayout.astro
---

This shows how to work with the JSON data from a previous recitation, in order to draw (first) a skeleton with connected body parts, and (second) to use the second data file, that contained an array of poses, to animate this skeleton.

- How to use arrays in this solution, instead of a long list of variables
- How to use arrays instead of repeated code
- Refactoring a set of lines of code to a function – in very tiny steps, so that you don’t break your brain and so that you can test each step along the way
- Some conventions for variable names – index variables, CONSTANT_CASE, underscore for private method (in class definitions)
- The concepts of magic numbers and anti-patterns; using variables as documentation
- Design choices about how to represent a list of pairs. Concrete and abstract data types
- `const`, and what it is good for
- Extra stuff: Making this all into a class, borrowing method names from p5.Image, using the keyboard and a slider to control the animation timeline
