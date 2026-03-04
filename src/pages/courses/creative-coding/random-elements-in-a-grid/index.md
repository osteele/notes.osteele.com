---
title: "Making Exceptions in a Grid"
layout: ../../../../layouts/BaseLayout.astro
---

-   [
    
    Review: Basic grid
    
    ](#block-72387e0a82fd4006975533aaef81bbd9)
-   [
    
    Draw some cells differently
    
    ](#block-2e5ab393000549bcb3690f50c4ad48c4)
-   [
    
    Draw some cells differently: using row and column
    
    ](#block-4a65ff4c466943019099ad48ebf9ef41)
-   [
    
    Draw some cells differently: using random()
    
    ](#block-6a3751c144f1484da9e04bdd02add4eb)
-   [
    
    Preventing Flicker
    
    ](#block-7ffd9ae2687944d0a60e28e2ce185453)
-   [
    
    The Problem
    
    ](#block-7e06cf0b7e1f492a8e753647748ab237)
-   [
    
    Technique #1: Do all drawing inside of setup()
    
    ](#block-019a34e5d89e4cdd9c3510de76ae9541)
-   [
    
    Technique #2: noLoop()
    
    ](#block-0f311c29f55a429bb26c39dd48236f03)
-   [
    
    Technique #3: replace random() by noise()
    
    ](#block-12c6d773829f45b19891685fc3b85490)
-   [
    
    Technique #4: Store the random values in an Array
    
    ](#block-dbf9ae5fdc0b4da9bdca0497a7001bd7)

# Review: Basic grid

Copy

```javascript
let rows = 5;
let columns = 6;

function setup() {
	createCanvas(windowWidth, windowHeight);
}

function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			square(x, y, 30);
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/63011677-a256-4a15-b607-0a8ee632006c/Untitled/w=1920,quality=90,fit=scale-down)

Note: From here on, the definitions of `rows`, `columns`, and `setup()` are not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function, and definitions of `rows` and `columns`:

Copy

```javascript
let rows = 5;
let columns = 6;

function setup() {
	createCanvas(windowWidth, windowHeight);
}
```

# Draw some cells differently

## Draw some cells differently: using row and column

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (row === 3) {
				if (column === 2) {
					size = 50;
				}
			}
			square(x, y, size);
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/43cf1970-40d6-4c98-8e53-0aac61528b92/Untitled/w=1920,quality=90,fit=scale-down)

The _nested_ `if` (the `if` within another `if`) above can be replaced by "and" (`&&`).

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (row === 3 && column === 2) {
				size = 50;
			}
			square(x, y, size);
		}
	}
}
```

Replace a cell by a circle. Rectangle positions are specified as the upper left corner, and circle positions are specified as the center, so this looks bad.

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (row === 3 && column === 2) {
				circle(x, y, size);
			} else {
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/546ef20b-0f3f-49c6-a3e6-085d28f9d4cd/Untitled/w=1920,quality=90,fit=scale-down)

`rectMode()` changes the behavior of `square()` (and `rect()`) to match `circle()`, so that it is easier to use `square()` and `circle()` (and `rect()` and `ellipse()`) interchangeably.

Note: This is a general principle. If there are two things – in this case functions — that you want to use interchangeably, see if there’s a way to make them more alike. In this case, there is a setting that does this. If they things that you created (such as functions you wrote), you have total control over this. Otherwise, you can create a _shim_ or _wrapper_ around one of the things.

Copy

```javascript
function draw() {
	background(200);
	rectMode(CENTER);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (row === 3 && column === 2) {
				circle(x, y, size);
			} else {
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/f8d22446-228d-450d-a0ab-2186054ed450/Untitled/w=1920,quality=90,fit=scale-down)

We can look at any combination of and `row` and `column`, and functions that combine them, to decide what to draw in a cell.

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (row % 3 === 0) {
				circle(x, y, size);
			} else {
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/7e8f83b4-f331-4113-be5c-79367b3fbd0d/Untitled/w=1920,quality=90,fit=scale-down)

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if ((row * column) % 3 === 0) {
				circle(x, y, size);
			} else {
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/e514fb12-4be0-4f30-a2d4-25759a5b3b40/Untitled/w=1920,quality=90,fit=scale-down)

Note: For the following code samples, the values of `rows` and `columns` have been changed to 20.

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if ((row ** 2 + column ** 2) % 3 === 0) {
				circle(x, y, size);
			} else {
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/6a1085e3-3f2d-41e4-8852-f06627ff14ee/Untitled/w=1920,quality=90,fit=scale-down)

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if ((row ** 2 + column ** 2) % 3 === 0) {
				fill('blue');
				circle(x, y, size);
			} else {
				fill('green');
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/183b94e6-89ed-4f31-ba13-ba504c668d1b/Untitled/w=1920,quality=90,fit=scale-down)

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if ((row ** 3 + column ** 2) % 3 === 0) {
				fill('blue');
				circle(x, y, size);
			} else {
				fill('green');
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/474f106e-269d-45df-b9d2-014fe19502ac/Untitled/w=1920,quality=90,fit=scale-down)

## Draw some cells differently: using `random()`

Let's say we want a quarter of the cells to be circles, in no particular order.

`random()` returns a number between 0 and 1, with a _uniform distribution_. This value will be less than 1/4 (`random() < 4`) about a quarter of the time, on average.

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (random() < 1/4) {
				fill('blue');
				circle(x, y, size);
			} else {
				fill('green');
				square(x, y, size);
			}
		}
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4837066b-417c-4596-bdef-94d8971ecaf0/Untitled/w=1920,quality=90,fit=scale-down)

Note: We could also test for `random(4) <= 1`.

# Preventing Flicker

## The Problem

Consider the sketch above.

Each time `grid()` is called, it will produce a different random pattern.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/881da985-4a6c-4d0d-8e9e-e780ac47b9d2/Untitled/w=1920,quality=90,fit=scale-down)

Since it is called thirty times per second, this creates a flicker effect.

![image](https://assets.super.so/69ceaa36-3dbd-448e-a6f1-948727642c5c/images/18ed6e04-0fd0-48ce-8dc8-2f33cabb5348/2021-02-25_16.42.56.gif?w=384)

## Technique #1: Do all drawing inside of `setup()`

First approach: eliminate the `draw()` function, and do everything in `setup()`.

Copy

```javascript
function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
	background(200);
  // draw the grid here
}
```

## Technique #2: `noLoop()`

Second approach: call `noLoop()` . This prevents `draw()` from being called a second time.

Copy

```javascript
function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
}

function draw() {
	background(200);
	noLoop();
  // draw the grid here
}
```

The advantage of `noLoop()` over putting everything inside of `setup()` is that the drawing can sometimes be animated, and sometimes not. Adding the following function to the sketch above adds the behavior that a new grid is drawn each time that the mouse is pressed.

Copy

```javascript
function mousePressed() {
	loop();
}
```

## Technique #3: replace `random()` by `noise()`

Third approach: use `noise()` instead of `random()`. `noise(x, y)` returns a different value for each different `x` and `y`, so `noise(row, column)` is a different value for each different grid position. Unlike `random()`, `noise()` with the same arguments always returns the same value. So for each position on the grid, `noise(row, column)` will always the same value. This eliminates the flicker.

Copy

This third approach allows us to keep animating.

Copy

```javascript
function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = map(mouseX, 0, width, 10, 30);
			if (noise(row, column) < 1/2) {
				fill('blue');
				circle(x, y, size);
			} else {
				fill('green');
				square(x, y, size);
			}
		}
	}
}
```

## Technique #4: Store the random values in an Array

There is a fourth approach, which is to save the information about each cell in an Array. We will cover that later.

©2020–2022 by Oliver Steele.
