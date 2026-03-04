---
title: "Scope and Shadowing"
layout: ../../../../layouts/BaseLayout.astro
---

[

🎶

Oliver’s Notes

](/)

-   [
    
    Scope
    
    ](#block-d714efe089df4624892a33173343cffc)
-   [
    
    Shadowing
    
    ](#block-5526d560a32b442d922ab6b316efb42f)
-   [
    
    The Error in Class
    
    ](#block-c9300362735d4bfead118249b1898e32)

(This page just shows code similar to what was used in class. The lecture slides have a more systematic explanation of variable scope and shadowing.)

# Scope

You can define a variable inside a function, or at the “top level” of the program (outside of any function).

Variables that are defined inside a function are _**local**_ to that function. Variables that are defined at the top level are _**global**_ variables.

(The code that defines a variable is the code that uses the word `let`, `var`, or `const`.)

Copy

```javascript
let x = 10;  // x is a global variable

function setup() {
	let y = 20; // y is local to setup()
}
```

Code in a function can use local variables and global variables. But code in one function can't see local variables that are defined in another function.

Copy

```javascript
let x = 10;

function setup() {
	createCanvas(windowWidth, windowHeight);
	let y = 20;
	circle(x, y, 10); // this works
}

function draw() {
	square(x, 0, 10); // this works
	square(0, y, 10); // this produces an error.
	// There is no variable named y in this function, and there is no global
	// variable named y.
}
```

Code in one function can't even see variables in a function that is calling it.

Copy

```javascript
function setup() {
	createCanvas(windowWidth, windowHeight);
}

function draw() {
	let x = 10;
	myShape();
}

function myShape() {
	square(x, 0, 10);  // error. No local or global variable named x
}
```

Use a parameter to get a variable one function to another.

Copy

```javascript
function setup() {
	createCanvas(windowWidth, windowHeight);
}

function draw() {
	let x = 10;
	myShape(x);
}

function myShape(x) {
	square(x, 0, 10);
}
```

Or make the function global.

Copy

```javascript
let x = 10;

function setup() {
	createCanvas(windowWidth, windowHeight);
}

function draw() {
	myShape();
}

function myShape() {
	square(x, 0, 10);
}
```

# Shadowing

If there is a local variable and a global variable, the variable name refers to the local variable. It can't “see” the global variable.

Copy

```javascript
let x = 10;

function draw() {
	let x = 20;
	square(x, x, 10);  // draws a rectangle at (20, 20).
}
```

P5 provides a function named `scale`.

If you define a variable named scale, you won't be able to use the P5 variable. This will work:

Copy

```javascript
function draw() {
	let scale = 10;
	square(0, 0, scale);
}
```

But this produces a weird error:

Copy

```javascript
function draw() {
	let scale = 10;
	scale(2, 3);
	square(0, 0, 1);
}
```

The error is because the code is trying to use `10` as a function (which it is not). It is as though the code were written this way:

Copy

```javascript
function draw() {
	10(2, 3);
	square(0, 0, 1);
}
```

# The Error in Class

Here's one way to define multiple variables:

Copy

```javascript
let x = 10;
let y = 20;
```

You can also use a single statement to define several variables:

Copy

```javascript
let x = 10, y = 20;
```

Instead of defining `x` and `y`, let's define `y` and `z`:

Copy

```javascript
	let y = map(sin(x / 100), -1, 1, 0, height), z = 0;
```

This defines two variables, `y` and `z`. `y` has initial value that is computed from `x` and `height`. `z` is initialized to the value `0`.

Now let's rename `z`to `rect`. The new variable `rect` _**shadows**_ the p5 function named `rect`. It's not a very reasonable thing to do, but JavaScript and p5 won't stop us. We just can't use `rect()` as a function later in function that defines `rect` as a local variable.

Copy

```javascript
	let y = map(sin(x / 100), -1, 1, 0, height), rect = 0;
```

Now let's look at the code that I wrote in class, that ended the first line with a comma instead of a semicolon.

Copy

```javascript
	let y = map(sin(x / 100), -1, 1, 0, height),
	rect(x, y, 1, 1);
```

Until you get to the `(` on the second line, this looks like the previous statement, that defines `y` and `rect`. However, it is only valid JavaScript if the second line continues as either `rect;` (to define a variable `rect` with no explicit initial value), or `rect =` (to specify the initial value for `rect`). That's why the error message complained that the _second_ line was missing an `=`, instead of that the _first_ line ended with a comma instead of a semicolon.
