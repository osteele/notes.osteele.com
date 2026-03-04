---
title: "JavaScript Iteration Methods"
layout: ../../../layouts/BaseLayout.astro
---

This page compares JavaScript Array iteration methods with traditional `for` loops, demonstrating how methods like `forEach`, `map`, `filter`, `every`, and `some` provide alternatives to manual iteration.

## Arrow Function Syntax

### Single Parameter

<div class="code-example"><pre><code>name =&gt; { console.info(name); }
name =&gt; console.info(name)</code></pre></div>

### Multiple Parameters

<div class="code-example"><pre><code>(name, i) =&gt; { console.info(i, ':', name); }
(name, i) =&gt; console.info(i, ':', name)</code></pre></div>

## forEach

Executes a function for each array element, ignoring return values.

### Iteration Method

<div class="code-example"><pre><code>dayNames.forEach(name =&gt; console.info(name));</code></pre></div>

### Traditional Loop

<div class="code-example"><pre><code>for (let i = 0; i &lt; dayNames.length; i++) {
  console.info(dayNames[i]);
}</code></pre></div>

## map

Creates a new array by applying a function to each element and collecting results.

<div class="code-example"><pre><code>let lengths = dayNames.map(stringLength);
// Returns: [6, 7, 9, 8, 6, 8, 6]</code></pre></div>

## filter

Produces a new array containing only elements meeting specified criteria.

<div class="code-example"><pre><code>let longDayNames = dayNames.filter(name =&gt; name.length &gt;= 8);
// Returns: ["Wednesday", "Thursday", "Saturday"]</code></pre></div>

## every

Returns `true` only if all array elements satisfy the test condition.

<div class="code-example"><pre><code>const endsWithDay = dayNames.every(name =&gt; name.match(/day$/));
// Returns: true</code></pre></div>

## some

Returns `true` if any array element satisfies the test condition.

<div class="code-example"><pre><code>const startsWithS = dayNames.some(name =&gt; name[0] === "S");
// Returns: true</code></pre></div>

## Key Advantages

1.  **Expressions:** Work directly in contexts requiring values (e.g., React JSX)
2.  **Nesting:** Stack methods without iterator variable conflicts, avoiding bugs like loop variable reuse

## Related

<ul class="page-list"><li><a href="/javascript/">JavaScript Resources</a></li><li><a href="/javascript/arrays/">JavaScript Arrays</a></li></ul>
