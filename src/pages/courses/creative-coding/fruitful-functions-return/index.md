---
title: "Fruitful Functions (return)"
layout: ../../../../layouts/BaseLayout.astro
---

-   [
    
    Review: Fruitless functions (for effect)
    
    ](#block-be33671d49e74c9ba943d6d164c63316)
-   [
    
    Use return to exit the function early
    
    ](#block-187124d0ab774fd584d17c5fd231929b)
-   [
    
    Fruitful Functions
    
    ](#block-ee6403fb902048568b4620facd1baf32)

# Review: Fruitless functions (for effect)

Here's a couple of lines that draw a shape (a circle and a square).

Copy

```javascript
function setup() {
	createCanvas(windowWidth, windowHeight);
	background(100);
}

function draw() {
	circle(mouseX, mouseY, 20);
	square(mouseX, mouseY, 30);
	
}
```

Extract them into a function.

Copy

```javascript
function draw() {
	squareAndCircle();
}

function squareAndCircle() {
	circle(mouseX, mouseY, 20);
	square(mouseX, mouseY, 30);
}
```

Parameterize the function.

Copy

```javascript
function draw() {
	squareAndCircle(mouseX, mouseY);

}

function squareAndCircle(x, y) {
	circle(x, y, 20);
	square(x, y, 30);
}
```

# Use `return` to exit the function early

This function only _sometimes_ draws the shape.

These are two different ways of doing the same thing.

Copy

```javascript
function squareAndCircle(x, y) {
	if (x < 300) return;
	circle(x, y, 20);
	square(x, y, 30);
}
```

Copy

```javascript
function squareAndCircle(x, y) {
	if (x >= 300) {
		circle(x, y, 20);
		square(x, y, 30);
	}
}
```

# Fruitful Functions

`squareAndCircle()`, above, is called _for effect_. Calling it has an effect on something (in this case, on what's in the canvas). `circle()` and `square()` are p5 functions that are also used for effect.

`sin()`, in contrast, is called in order to use its value. The call to `sin()` in this code doesn't do anything (except slow the program down slightly):

Copy

```javascript
function draw() {
	sin(10);
}
```

In order to use make use of `sin()`, we need to do something with the value that it returns.

Copy

```javascript
function draw() {
	let d = sin(10);
	circle(d, d, 10);
}
```

A sequence of statements that are executed for effect can be extracted into a fruitless function, that is called for effect. This is what we did with `circleAndSquare()`, above.

An expression can be extracted into a fruitful function, that uses `return` to send a value back to the code that calls it. The following two codes have the same effect.

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		let y = map(sin(x / 100), -1, 1, 0, height);
		square(x, y, 1);
	}
}
```

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		let y = computeY(x);
		square(x, y, 1);
	}
}

function computeY(x) {
	return map(sin(x / 100), -1, 1, 0, height);
}
```

A fruitful function can contain several statements (just like a fruitless function), that are run one after another in order to compute a value. All of these functions are equivalent:

Copy

```javascript
function computeY(x) {
	return map(sin(x / 100), -1, 1, 0, height);
}
```

Copy

```javascript
function computeY(x) {
	let y = map(sin(x / 100), -1, 1, 0, height);
	return y;
}
```

Copy

```javascript
function computeY(x) {
	let range = sin(x / 100);
	let y = map(range, -1, 1, 0, height);
	return y;
}
```

You can also include `if` statements in a fruitful function (just like a fruitless function).

Here are two ways of drawing rectangles that are small on the left side of the screen and large on the right side of the screen, that don't use a separate function:

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		if (x < 300) {
			square(x, x, 1);
		} else {
			square(x, x, 10);
		}
	}
}
```

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		let size;
		if (x < 300) {
			size = 1;
		} else {
			size = 10;
		}
		square(x, x, size);
	}
}
```

And here are two ways to factor the size computation into a separate function:

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		square(x, x, computeSize(x));
	}
}

function computeSize(x) {
	if (x < 300) {
		return 1;
	} else {
		return 10;
	}
}
```

Copy

```javascript
function draw() {
	for (let x = 0; x < width; x++) {
		square(x, x, computeSize(x));
	}
}

function computeSize(x) {
	let size = 10;
	if (x < 300) {
		size = 1;
	} else {
		size = 10;
	}
	return size;
}
```

©2020–2022 by Oliver Steele.
