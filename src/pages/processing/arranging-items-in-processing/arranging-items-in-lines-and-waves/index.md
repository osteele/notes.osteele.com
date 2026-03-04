---
title: "Arranging a Line of Items (Processing)"
layout: ../../../../layouts/BaseLayout.astro
---

# Arranging items in a line

This code draws a line of items – as many as necessary to reach the edge of the canvas. In this case, the items are circles. The code can be adapted to draw squares, or more complicated figures composed of multiple shapes.

The code draws shapes as will fit in the canvas width (`x <= width`), spaced 50 pixels apart (`x += 50`).

```java
void setup() {
	size(windowWidth, windowHeight);
	background(100);
}

void draw() {
	for (float x = 10; x <= width; x += 50) {
		circle(x, 100, 40);
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled.png)

Note: From here on, the definition of `setup()` is not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function with your choice of canvas size:

```java
//for example
void setup() {
	createCanvas(600, 600);
}
```

# Arranging items in a line – by item count

What if we want to draw a fixed number of items? This code draws exactly 20 items, no matter how wide the canvas is. It uses `i` to count the number of shapes, from 0 to 19.

```java
void draw() {
	float x = 10;
	for (int i = 0; i < 20; i++) {
		circle(x, 100, 40);
		x += 50;
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 1.png)

# Geometric Progressions

The code above increases `x` by the same amount each step. This is an [*arithmetic progression*](https://en.wikipedia.org/wiki/Arithmetic_progression).

We can also increase `x` by an increasing amount. This is a [*geometric progression*](https://en.wikipedia.org/wiki/Geometric_progression).

```java
void draw() {
	float x = 10;
	for (int i = 0; i < 20; i++) {
		circle(x, 100, 40);
		x *= 1.2;
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 2.png)

Changing the spacing is useful when the size changes too.

```java
void draw() {
	float x = 20;
	float size = 5;
	for (int i = 0; i < 20; i++) {
		circle(x, 100, size);
		x *= 1.15;
		size *= 1.15;
	}
}
```

![Screenshot of Safari (4-8-22, 9-36-22 AM).png](/images/arranging-items-in-lines-and-waves/Screenshot_of_Safari_%284-8-22_9-36-22_AM%29.png)

# Accumulating versus deriving

Back to the arithmetic progression:

```java
void draw() {
	float x = 10;
	for (int i = 10; i < 20; i++) {
		circle(x, 100, 40);
		x += 50;
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 1.png)

This strategy for computing the value of `x` ***accumulates*** a value. `x` starts out with a value (10); then each time through the loop, the value is updated.

An alternative to accumulation is to ***derive*** the value of `x` from scratch each time, directly from the value of `i`. The *shape position* is derived from the *loop index*. This has the same effect as the previous code, but it will allow us to plug in different functions besides the linear function $x = 10 + 50i$ used here. We’ll see that later.

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		circle(x, 100, 40);
	}
}
```

# Bending the line

Derive `y` from `i` as well.

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = 100 + 10 * i;
		circle(x, y, 40);
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 3.png)

Replace `10 * i` by `20 * i` (left) or `5 * i` (right) to increase or decrease the *angle* of the line (to make it more or less steep).

![](/images/arranging-items-in-lines-and-waves/Untitled 4.png)

![](/images/arranging-items-in-lines-and-waves/Untitled 5.png)

# Waves

The payoff to using a function to compute the position is that we can use different functions, for different effects. For example, $y = 100 + 20 \sin(i)$.

`sin()` returns a number between -1 and 1. Varying the y position by that much is barely detectable. (Try it.) This code multiples the output of `sin()` by 20, to produce a number between -20 and 20, for a more pronounced wiggle. (It is similar to `random(-20, 20)`, except that the change from one circle to the next is sinusoidal instead of random.)

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = 100 + 20 * sin(i);
		circle(x, y, 40);
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 6.png)

Instead of using an equation $y = 100 + 20 \sin(i)$, we can use the `map()` function to do the same thing. Either `y = 100 + map(sin(i), -1, 1, -20, 20)` or `y = map(sin(i), -1, 1, 80, 120)` would work. The latter most clearly expresses the range of values (80 to 120) that wil be assigned to `y`.

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = map(sin(i), -1, 1, 80, 120);
		circle(x, y, 40);
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 7.png)

Also vary the size:

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = map(sin(i), -1, 1, 80, 120);
		float size = 20 + 20 * cos(i);
		circle(x, y, size);
	}
}
```

![](/images/arranging-items-in-lines-and-waves/Untitled 8.png)

# Animation

We can make the sketch by using time as an input. Modify `y` so that it is a function of time (`millis()`). This causes the sketch to animate.

```java
void draw() {
	background(100);

	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = map(sin(i + millis() / 100.), -1, 1, 80, 120);
		circle(x, y, 20);
	}
}
```

![CleanShot 2022-04-08 at 09.32.17.gif](/images/arranging-items-in-lines-and-waves/CleanShot_2022-04-08_at_09.32.17.gif)

Note: Now that the circles are drawn in a different position each time `draw()` is called, it is important to clear the canvas (`background(200)`) at the beginning of `draw()`. Otherwise each circle will be drawn on top of all the circles drawn by previous calls to `draw()`. (This has been happening in all the sketches so far, but since all the circles were drawn at the same position, this was not detectable.)

Try this: Change the sketch to animate the size of the object, instead of its position. You can base your work off of the previous two sketches.

---

Original p5.js version ©2020–2022 by Oliver Steele. Updated for Processing by Margaret Minsky.
