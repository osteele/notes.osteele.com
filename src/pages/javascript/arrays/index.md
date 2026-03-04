---
title: "JavaScript Arrays"
layout: ../../../layouts/BaseLayout.astro
---

## Learning Resources

Dan Shiffman's Coding Train video tutorials are recommended:

<ul class="page-list"><li><a href="https://www.youtube.com/playlist?list=PLRqwX-V7Uu6Zy51Q-x9tMWIv9cueOFTFA">p5.js Tutorial Playlist</a> – Videos 7.1-7.5 covering array fundamentals, loops, objects, and removal operations</li><li><a href="https://www.youtube.com/playlist?list=PLRqwX-V7Uu6aAEUqu96Newc-7qpuh-cxc">Array Functions Playlist</a> – Videos 16.4-16.9 exploring iteration patterns and functional methods like <code>map()</code>, <code>reduce()</code>, <code>filter()</code>, and <code>sort()</code></li></ul>

## Reference Materials

<ul class="page-list"><li><a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array">MDN Web Docs: Array</a></li><li><a href="https://htmlcheatsheet.com/js/">JS Cheat Sheet</a> – Arrays module</li><li><a href="https://arrayexplorer.netlify.app/">JavaScript Array Explorer</a> – Interactive tool by Sarah Drasner</li></ul>

## Array Operations Table

<table><thead><tr><th>Operation</th><th>Read</th><th>Insert</th><th>Remove</th><th>Replace</th></tr></thead><tbody><tr><td><strong>First</strong></td><td><code>array[0]</code></td><td><code>array.unshift('a')</code></td><td><code>array.shift()</code></td><td><code>array[0] = 'A'</code></td></tr><tr><td><strong>Middle</strong></td><td><code>array.slice(2, 3)</code></td><td><code>array.splice(2, 0, 'c', 'd', 'e')</code></td><td><code>array.splice(2, 3)</code></td><td><code>array.splice(2, 3, 'C', 'D', 'E')</code></td></tr><tr><td><strong>Last</strong></td><td><code>array[array.length - 1]</code></td><td><code>array.push('z')</code></td><td><code>array.pop()</code></td><td><code>array[array.length-1] = 'Z'</code></td></tr></tbody></table>

## Spread Operator (...) Shortcuts

Modern JavaScript provides shorter syntax using the spread operator:

### Array Copying

<div class="code-example"><pre><code>// Traditional
let copy = anArray.slice(0);

// Modern
let copy = [...anArray];</code></pre></div>

### Element Extraction (Destructuring)

<div class="code-example"><pre><code>// Traditional
let first = anArray[0];
let second = anArray[1];

// Modern
let [first, second] = anArray;</code></pre></div>

### Array Concatenation

<div class="code-example"><pre><code>// Traditional
let combined = anArray.concat(anotherArray);

// Modern
let combined = [...anArray, ...anotherArray];</code></pre></div>

### Appending Arrays

<div class="code-example"><pre><code>// Traditional
anArray.push.apply(anArray, anotherArray);

// Modern
anArray.push(...anotherArray);</code></pre></div>

## Related

<ul class="page-list"><li><a href="/javascript/">JavaScript Resources</a></li><li><a href="/courses/creative-coding/iteration-notes/">Iteration Notes</a></li></ul>
