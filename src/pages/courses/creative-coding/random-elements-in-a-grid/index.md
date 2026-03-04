---
title: "Making Exceptions in a Grid"
layout: ../../../../layouts/BaseLayout.astro
---

# Review: Basic grid

```jsx
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

![](/images/random-elements-in-a-grid/Untitled.png)

Note: From here on, the definitions of `rows`, `columns`, and `setup()` are not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function, and definitions of `rows` and `columns`:

```jsx
let rows = 5;
let columns = 6;

function setup() {
	createCanvas(windowWidth, windowHeight);
}
```

# Draw some cells differently

## Draw some cells differently: using row and column

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 1.png)

The *nested* `if` (the `if` within another `if`) above can be replaced by "and" (`&&`).

```jsx
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

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 2.png)

`rectMode()` changes the behavior of `square()` (and `rect()`) to match `circle()`, so that it is easier to use `square()` and `circle()` (and `rect()` and `ellipse()`) interchangeably.

Note: This is a general principle. If there are two things – in this case functions — that you want to use interchangeably, see if there’s a way to make them more alike. In this case, there is a setting that does this. If they things that you created (such as functions you wrote), you have total control over this. Otherwise, you can create a *shim* or *wrapper* around one of the things.

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 3.png)

We can look at any combination of and `row` and `column`, and functions that combine them, to decide what to draw in a cell.

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 4.png)

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 5.png)

Note: For the following code samples, the values of `rows` and `columns` have been changed to 20.

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 6.png)

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 7.png)

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 8.png)

## Draw some cells differently: using `random()`

Let's say we want a quarter of the cells to be circles, in no particular order.

`random()` returns a number between 0 and 1, with a *uniform distribution*. This value will be less than 1/4 (`random() < 4`) about a quarter of the time, on average.

```jsx
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

![](/images/random-elements-in-a-grid/Untitled 9.png)

Note: We could also test for `random(4) <= 1`.

# Preventing Flicker

## The Problem

Consider the sketch above.

Each time `grid()` is called, it will produce a different random pattern.

![](/images/random-elements-in-a-grid/Untitled 10.png)

Since it is called thirty times per second, this creates a flicker effect.

![](/images/random-elements-in-a-grid/2021-02-25_16.42.56.gif)

## Technique #1: Do all drawing inside of `setup()`

First approach: eliminate the `draw()` function, and do everything in `setup()`.

```jsx
function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
	background(200);
  // draw the grid here
}
```

## Technique #2: `noLoop()`

Second approach: call `noLoop()` . This prevents `draw()` from being called a second time.

```jsx
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

```jsx
function mousePressed() {
	loop();
}
```

## Technique #3: replace `random()` by `noise()`

Third approach: use `noise()` instead of `random()`. `noise(x, y)` returns a different value for each different `x` and `y`, so `noise(row, column)` is a different value for each different grid position. Unlike `random()`, `noise()` with the same arguments always returns the same value. So for each position on the grid, `noise(row, column)` will always the same value. This eliminates the flicker.

```jsx
function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CENTER);
}

function draw() {
	background(200);
	for (let row = 0; row < rows; row++) {
		for (let column = 0; column < columns; column++) {
			let x = 30 + 50 * column;
			let y = 40 + 50 * row;

			let size = 30;
			if (noise(row, column) < 1/4) {
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

This third approach allows us to keep animating.

```jsx
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

---

©2020–2022 by Oliver Steele.
