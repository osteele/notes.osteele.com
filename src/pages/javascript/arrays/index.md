---
title: "JavaScript Arrays"
layout: ../../../layouts/BaseLayout.astro
---

# Learning

### Dan Shiffman Coding Train videos

Playlist: p5.js Tutorial

- [7.1: What is an array?](https://youtu.be/VIQoUghHSxU)
- [7.2: Arrays and Loops](https://youtu.be/RXWO3mFuW-I)
- [7.3: Arrays of Objects](https://youtu.be/fBqaA7zRO58)
- [7.5: Removing Objects from Arrays](https://youtu.be/tA_ZgruFF9k)

Playlist: [Array Functions in JavaScript](https://www.youtube.com/playlist?list=PLRqwX-V7Uu6aAEUqu96Newc-7qpuh-cxc) (from Topics of JavaScript/ES6)

- [16.4: for...of loop](https://youtu.be/Y8sMnRQYr3c)
- [16.6: Array Functions: map() and fill()](https://youtu.be/EnYlhbpzhU4)
- [16.7: Array Functions: reduce()](https://youtu.be/-LFjnY1PEDA)
- [16.8: Array Functions: filter()](https://youtu.be/qmnH5MT_luk)
- [16.9: Array Functions: sort()](https://youtu.be/MWD-iKzR2c8)

# Reference

[MDN Web Docs: Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) describes the Array type, and documents and has examples for each of the Array methods.

The [JS Cheat Sheet](https://htmlcheatsheet.com/js/) has a module on Arrays:

![From the [JS Cheat Sheet](https://htmlcheatsheet.com/js/).](/images/arrays/arrays-02.png)

From the [JS Cheat Sheet](https://htmlcheatsheet.com/js/).

# Array Methods

Sarah Drasner's [JavaScript Array Explorer](https://arrayexplorer.netlify.app) allows you to choose the operation, and see the code (the Array method) that does this.

![[JavaScript Array Explorer](https://arrayexplorer.netlify.app)](/images/arrays/arrays-01.png)

[JavaScript Array Explorer](https://arrayexplorer.netlify.app)

### Table: Reading, Inserting, Removing, and Replacing Elements

***Read***

***Insert***

***Remove***

***Replace***

***First Element***

`array[0]`

`array.unshift('a')`

`array.shift()`

`array[0] = 'A'`

***Middle***

`array.slice(2, 3)`

`array.splice(2, 0, 'c', 'd', 'e')`

`array.splice(2, 3)`

`array.splice(2, 3, 'C', 'D', 'E')`

***Last Element***

`array[array.length - 1]`

`array.push('z')`

`array.pop()`

`array[array.length-1] = 'Z'`

### More

- The [JavaScript.info](http://javascript.info) chapters on [Arrays](https://javascript.info/array) and [Array Methods](https://javascript.info/array-methods) organize the Array methods by their effects: for example, add or remove items from the *beginning* (`shift()` and `unshift()`), the *middle* (`slice()` and `splice()`), and the *end* (`push()` and `pop()`).

[JavaScript Iteration Methods](/javascript/iteration-methods/) compares `array.map()`, `array.forEach()`, `array.some()`, and `array.every()` to the same functionality written using `for` loops.

# Tutorials

- The [JavaScript Tutorial](https://www.javascripttutorial.net/) has a section JavaScript Array, with chapters that [introduce Array](https://www.javascripttutorial.net/javascript-array/), and recipes for specific operations on Arrays.
- [How to Code in JavaScript > Understanding Arrays in JavaScript](https://www.digitalocean.com/community/tutorials/understanding-arrays-in-javascript)
- Code Analogies [article](https://blog.codeanalogies.com/2017/04/29/javascript-arrays-and-objects-are-just-like-books-and-newspapers/) and [Interactive Tutorial](https://www.codeanalogies.com/objects-arrays-practice)

# Array Ellipsis Shortcuts

Some Array methods have syntactic alternatives that use the ellipsis `...`. (In JavaScript source code, the ellipsis is three period characters `.`, not the single ellipsis character `…` that is used in typesetting natural-language text.)

### Using Array Methods

### Using Ellipses

### Description

*Array Creation*

```jsx
anArray.slice(0)
```

```jsx
[...anArray]
```

Make a copy of an Array. `arrayCopy` has the same elements as `anArray`, but modifying `arrayCopy` does not modify `anArray` (and vice versa).

This is an expression, that has a value. To initialize a new variable to this value, write e.g. `let copy = anArray.slice(0)` or `let copy = [...anArray]`.

This is the equivalent of Python's `anArray[:]`.

```jsx
let newArray = anArray.slice(0);
newArray.push(newFirst);
```

```jsx
let newArray = [newFirst, ...anArray];
```

Creates a new array that is a newFirst, followed by all the elements of `anArray`.

We go ahead and assign this value to a variable, because this is the only way to do this using the “Array Methods” technique.

*Retrieving Array elements*

```jsx
let first = anArray[0];
let second = anArray[1];
```

```jsx
let [first, second] = anArray; 
```

Extract the first and second element of an array into new variables `first` and `second`.

For example, if `anArray` has the value `['a', 'b', 'c']`, then `first` will be initialized to `'a'`, and `second` will be initialized to `'b'`.

```jsx
let first = anArray[0];
let rest = anArray.slice(1);
```

```jsx
let [first, ...rest] = anArray;
```

Initialize `first` to the first element of the Array. Initialize `rest` to a new Array that has all the elements of the Array *except the first element*.

For example, if `anArray` has the value `['a', 'b', 'c']`, then `first` will be initialized to `'a'`, and `rest` will be initialized to `['b', 'c']`. 

*Concatenating Arrays*

```jsx
anArray.concat(anotherArray)
```

```jsx
[...anArray, ...anotherArray]
```

Creates a new array, that has all the elements of one Array (`anArray`) followed by all the elements of another Array (`anotherArray`).

For example, if `anArray` has the value `['a', 'b', 'c']` and `anotherArray` has the value `['d', 'e', 'f']`, then the expression will have the value `['a', 'b', 'c', 'd', 'e', 'f']`.

This is the equivalent of Python's `anArray + anotherArray`.

```jsx
anArray.push.apply(anArray, anotherArray);
```

```jsx
anArray.push(...anotherArray);
```

Modifies `anArray` by appending the elements of `anotherArray` to it.

For example, if before the statement is executed, `anArray` has the value `['a', 'b', 'c']` and `anotherArray` has the value `['d', 'e', 'f']`, then after the statement has been executed `anArray` will have the value `['a', 'b', 'c', 'd', 'e', 'f']`.

This is the equivalent of Python's `anArray += anotherArray`.
