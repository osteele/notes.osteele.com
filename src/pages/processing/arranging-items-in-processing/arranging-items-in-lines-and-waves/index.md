---
title: "Arranging a Line of Items (Processing)"
layout: ../../../../layouts/BaseLayout.astro
---

-   [
    
    Arranging items in a line
    
    ](#block-8a4a60af9a9c4358898df63710ee1ec3)
-   [
    
    Arranging items in a line – by item count
    
    ](#block-6d8260bf2f6c41b58724867598352364)
-   [
    
    Geometric Progressions
    
    ](#block-f97ab734835f4d87a38e6b3906523506)
-   [
    
    Accumulating versus deriving
    
    ](#block-1bdd6fcbba9e4dbabe82097d41417bbb)
-   [
    
    Bending the line
    
    ](#block-cb324d50de2144818d050e988d250045)
-   [
    
    Waves
    
    ](#block-e8dd3864f98041ada114116dca5a63eb)
-   [
    
    Animation
    
    ](#block-272961f1e81043aaad1f6ac794ba4b22)

# Arranging items in a line

This code draws a line of items – as many as necessary to reach the edge of the canvas. In this case, the items are circles. The code can be adapted to draw squares, or more complicated figures composed of multiple shapes.

The code draws shapes as will fit in the canvas width (`x <= width`), spaced 50 pixels apart (`x += 50`).

Copy

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

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/618c5883-b69e-4f48-8a43-312b6ce76334/Untitled/w=1920,quality=90,fit=scale-down)

Note: From here on, the definition of `setup()` is not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function with your choice of canvas size:

Copy

```java
//for example
void setup() {
	createCanvas(600, 600);
}
```

# Arranging items in a line – by item count

What if we want to draw a fixed number of items? This code draws exactly 20 items, no matter how wide the canvas is. It uses `i` to count the number of shapes, from 0 to 19.

Copy

```java
void draw() {
	float x = 10;
	for (int i = 0; i < 20; i++) {
		circle(x, 100, 40);
		x += 50;
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/87ccc934-f68e-4ff9-97cb-39f3bc4d2604/Untitled/w=1920,quality=90,fit=scale-down)

# Geometric Progressions

The code above increases `x` by the same amount each step. This is an [_arithmetic progression_](https://en.wikipedia.org/wiki/Arithmetic_progression).

We can also increase `x` by an increasing amount. This is a [_geometric progression_](https://en.wikipedia.org/wiki/Geometric_progression).

Copy

```java
void draw() {
	float x = 10;
	for (int i = 0; i < 20; i++) {
		circle(x, 100, 40);
		x *= 1.2;
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5088d503-adf9-491b-9d7a-3baa4d2cea10/Untitled/w=1920,quality=90,fit=scale-down)

Changing the spacing is useful when the size changes too.

Copy

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

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/62b58cb5-15fd-404c-a657-a05c463fea27/Screenshot_of_Safari_(4-8-22_9-36-22_AM)/w=1920,quality=90,fit=scale-down)

# Accumulating versus deriving

Back to the arithmetic progression:

Copy

```java
void draw() {
	float x = 10;
	for (int i = 10; i < 20; i++) {
		circle(x, 100, 40);
		x += 50;
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/8bbc4717-2f83-4eab-a698-12e8947f22eb/Untitled/w=1920,quality=90,fit=scale-down)

This strategy for computing the value of `x` **_accumulates_** a value. `x` starts out with a value (10); then each time through the loop, the value is updated.

An alternative to accumulation is to _**derive**_ the value of `x` from scratch each time, directly from the value of `i`. The _shape position_ is derived from the _loop index_. This has the same effect as the previous code, but it will allow us to plug in different functions besides the linear function x\=10+50ix = 10 + 50ix\=10+50i used here. We’ll see that later.

Copy

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

Copy

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = 100 + 10 * i;
		circle(x, y, 40);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/13a5e2b9-2cd0-4e36-a807-f4d334479d9c/Untitled/w=1920,quality=90,fit=scale-down)

Replace `10 * i` by `20 * i` (left) or `5 * i` (right) to increase or decrease the _angle_ of the line (to make it more or less steep).

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/cf557fd4-0480-4fa4-aa96-f0af1f72120e/Untitled/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/22b26d60-5931-4f73-975e-1e8804372a4a/Untitled/w=1920,quality=90,fit=scale-down)

# Waves

The payoff to using a function to compute the position is that we can use different functions, for different effects. For example, y\=100+20sin⁡(i)y = 100 + 20 \\sin(i)y\=100+20sin(i).

`sin()` returns a number between -1 and 1. Varying the y position by that much is barely detectable. (Try it.) This code multiples the output of `sin()` by 20, to produce a number between -20 and 20, for a more pronounced wiggle. (It is similar to `random(-20, 20)`, except that the change from one circle to the next is sinusoidal instead of random.)

Copy

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = 100 + 20 * sin(i);
		circle(x, y, 40);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/d4d40c5e-b6c7-453b-8bb1-a578738f86b5/Untitled/w=1920,quality=90,fit=scale-down)

Instead of using an equation y\=100+20sin⁡(i)y = 100 + 20 \\sin(i)y\=100+20sin(i), we can use the `map()` function to do the same thing. Either `y = 100 + map(sin(i), -1, 1, -20, 20)` or `y = map(sin(i), -1, 1, 80, 120)` would work. The latter most clearly expresses the range of values (80 to 120) that wil be assigned to `y`.

Copy

```java
void draw() {
	for (int i = 0; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = map(sin(i), -1, 1, 80, 120);
		circle(x, y, 40);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ea20166a-cc54-46c1-9610-305b817c7861/Untitled/w=1920,quality=90,fit=scale-down)

Also vary the size:

Copy

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

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/72b25b35-ee52-453e-a50b-6ebc56f610a7/Untitled/w=1920,quality=90,fit=scale-down)

# Animation

We can make the sketch by using time as an input. Modify `y` so that it is a function of time (`millis()`). This causes the sketch to animate.

Copy

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

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/47042f59-a185-4fbc-ac64-c2d2c9c751c8/CleanShot_2022-04-08_at_09.32.17/w=1920,quality=90,fit=scale-down)

Note: Now that the circles are drawn in a different position each time `draw()` is called, it is important to clear the canvas (`background(200)`) at the beginning of `draw()`. Otherwise each circle will be drawn on top of all the circles drawn by previous calls to `draw()`. (This has been happening in all the sketches so far, but since all the circles were drawn at the same position, this was not detectable.)

Try this: Change the sketch to animate the size of the object, instead of its position. You can base your work off of the previous two sketches.

Original p5.js version ©2020–2022 by Oliver Steele. Updated for Processing by Margaret Minsky.
