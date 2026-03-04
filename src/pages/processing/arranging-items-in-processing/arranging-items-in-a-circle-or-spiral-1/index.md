---
title: "Arranging Items in a Circle or Spiral (Processing)"
layout: ../../../../layouts/BaseLayout.astro
---

-   [
    
    Review: Basic line
    
    ](#block-9f0c55a4ceb649bbb8e8115fdeae5807)
-   [
    
    Using sin and cos
    
    ](#block-91df806c5d8342479edf3f07aa2399d3)
-   [
    
    Items in a circle
    
    ](#block-a521ac3e1f4b45d3a9e42894b2c4b967)
-   [
    
    Drawing some items differently
    
    ](#block-39180ef180714c2cbffaaa8be57b3b27)
-   [
    
    Animating the circle
    
    ](#block-8519ca84e605429f8300096b8816e138)
-   [
    
    From circle to spiral
    
    ](#block-ab2257fe4db9458797ea42321ebb84cc)

# Review: Basic line

This code from [Arranging a Line of Items](/courses/creative-coding/arranging-items-in-a-line/) draws a line of shapes. It uses the _derivation_ strategy, to calculate a value for x directly from i each time through the loop.

Copy

```java
void setup() {
	size(600, 600);
}

void draw() {
	for (int i = 10; i < 20; i++) {
		float x = 10 + 50 * i;
		float y = 100;
		circle(x, 100, 40);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/edb3947c-8d96-4e61-83cc-1d6074d4fe12/Screenshot_of_Notion_(4-7-22_11-42-58_PM)/w=1920,quality=90,fit=scale-down)

Note: From here on, the definition of `setup()` is not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function:

Copy

```java
void setup() {
	size(600, 600);
}
```

# Using `sin` and `cos`

We can use the `sin()` or `cos()` functions to make the items swing between the top and bottom of the band, as the index value progresses.

Copy

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 20 + 50 * i;
		float y = 100 + 50 * sin(i);
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5bc901c0-6276-46c1-b087-222da0b6501c/Screenshot_of_Safari_(4-7-22_11-50-43_PM)/w=1920,quality=90,fit=scale-down)

Copy

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 20 + 50 * i;
		float y = 100 + 50 * cos(i);
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4d4ef0af-7b02-4fbf-a079-0aaaa26ff941/Screenshot_of_Safari_(4-7-22_11-51-20_PM)/w=1920,quality=90,fit=scale-down)

Note: The sketches in this section end up computing `sin(0)`, `sin(1)`, `sin(2)`, all the way to `sin(9)`. The Processing `sin()` function actually takes radians, so typically a sketch would take much smaller steps. These large steps happen to draw sine waves anyway for complicated math-y reasons (because 1 and pipipi are incommensurate), and this is just a step towards a sketch that will do things correctly anyway. So use the code in the section [Items in a circle](/processing/arranging-items-in-processing/arranging-items-in-a-circle-or-spiral-1/) to copy from, not the sketches in this section.

Trying to use `sin` (or `cos`) for both x and y arranges the items on a diagonal line. This is true any time that x and y use the same equation, because then they will have the same value.

Copy

```java
void draw() {
  for (int i = 0; i < 10; i++) {
    float x = 100 + 50 * sin(i);
    float y = 100 + 50 * sin(i);
    circle(x, y, 50);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5e49f4a8-9cb1-4e01-8d22-b351808e05c5/Untitled/w=1920,quality=90,fit=scale-down)

The solution is to use `cos` for `x` and `sin` for `y`. These functions are cleverly designed so that using them together this way makes a circle.

Let’s look at just using `sin` for `y` (instead of `x`), and compare that to the code a couple of sketches above that uses `cos` for `x`.

Copy

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 100 + 50 * cos(i);
		float y = 100 + 50 * i;
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/2eda052b-3e0e-48ac-98bd-8771a7a5087b/Screenshot_of_Notion_(4-7-22_11-56-41_PM)/w=1920,quality=90,fit=scale-down)

Combining `cos` for `x` with `sin` for `y` creates a circle.

Copy

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 100 + 50 * cos(i);
		float y = 100 + 50 * sin(i);
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/870a1bc1-c82b-4b77-92b3-7e8ca545b7de/Screenshot_of_Notion_(4-8-22_12-00-13_AM)/w=1920,quality=90,fit=scale-down)

There’s two things that may be wrong with this circle, depending on your design intent: (1) it is too small relative to the items that are placed along its edge; and, the items are wrapped around the circle more than once.

The first problem can be addressed by changing the `50` in `50 * cos(i)` and `50 * sin(i)` to a larger number. We will also change the `100` in `100 + 50 * cos(i)` to a larger number, to move the center of the arrangement circle _right_ so that the whole circle stays on the screen.

# Items in a circle

By default, `sin` and `cos` repeat every 2π2\\pi2π. We need to insure that the number that we putting into them varies from 0 to 2π2\\pi2π by the time the loop is done. Since `i` varies from 0 to (just under) 10, `i * TWO_PI / 10` varies from 0 to (one step under) `TWO_PI`.

Copy

```javascript
void draw() {
	for (int i = 0; i < 10; i++) {
		float angle = i * TWO_PI / 10;
		float x = 250 + 150 * cos(angle);
		float y = 300 + 150 * sin(angle);
		circle(x, y, 50);
	}
}
```

Note: We could also have used `map(i, 0, 10, 0, TWO_PI)` instead of `i * TWO_PI / 10`.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/690e2fc2-e6a9-48b7-ae9e-8dff405478d6/Untitled/w=1920,quality=90,fit=scale-down)

Here is another way of doing this. `angleMode(DEGREES)` causes `sin` and `cos` to repeat every 360, instead of every 2π2\\pi2π.

Copy

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float angle = radians(i * 360 / 10);
		float x = 250 + 150 * cos(angle);
		float y = 300 + 150 * sin(angle);
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/82a61b7e-48c5-43c3-9372-fdcffa123f47/Untitled/w=1920,quality=90,fit=scale-down)

Yet another way to do this is to increment the angle directly instead of computing it from the index position. This is useful if we know the number of degrees we want to leave between items, instead of the number of items.

Copy

```java
void draw() {
	for (float angle = 0; angle < 360; angle += 10) {
		float x = 250 + 150 * cos(radians(angle));
		float y = 300 + 150 * sin(radians(angle));
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/5bac1946-18f6-4d42-9a7b-94e6a99d9d7b/Untitled/w=1920,quality=90,fit=scale-down)

# Drawing some items differently

We can use a conditional in order to draw some items differently from others.

Copy

```java
void draw() {
  for (int i = 0; i < 360; i += 10) {
    float angle = radians(i);
    float x = 250 + 150 * cos(angle);
    float y = 300 + 150 * sin(angle);
    
    if (i == 180) {
      fill(0);
    } else {
      fill(255);
    }
    circle(x, y, 50);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/1ed799be-1e75-47aa-828a-656a0f859067/Untitled/w=1920,quality=90,fit=scale-down)

Copy

```java
void draw() {
  for (int i = 0; i < 360; i += 10) {
    float angle = radians(i);
    float x = 250 + 150 * cos(angle);
    float y = 300 + 150 * sin(angle);
    
    if (i == 180) {
      fill(0);
    } else {
      fill(255);
    }
    if (i == 90) {
      strokeWeight(5);
    } else {
      strokeWeight(1);
    }
    circle(x, y, 50);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b6e0b7cf-db85-4bd8-94fd-633ca0239ae1/Untitled/w=1920,quality=90,fit=scale-down)

Copy

```java
void draw() {
	for (int i = 0; i < 360; i += 10) {
		float angle = radians(i);
		float radius = 150;
		float x = 250 + radius * cos(angle);
		float y = 300 + radius * sin(angle);
		
		if (i % 40 == 0) {
			fill(0);
		} else {
			fill(255);
		}
		if (i == 90) {
			strokeWeight(5);
		} else {
			strokeWeight(1);
		}
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/60fdc5de-8daa-4be3-910a-d0a7481ed96c/Untitled/w=1920,quality=90,fit=scale-down)

# Animating the circle

Incorporate the time (`millis()`) into the equation, in order to animate the circle.

Copy

```java
void draw() {
	background(200);
	for (int i = 0; i < 360; i += 10) {
		float angle = radians(i + millis() / 15);
		float x = 250 + 150 * cos(angle);
		float y = 300 + 150 * sin(angle);
		
		if (i % 40 == 0) {
			fill(0);
		} else {
			fill(255);
		}
		if (i == 90) {
			strokeWeight(5);
		} else {
			strokeWeight(1);
		}
		circle(x, y, 50);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ec5f8554-61d7-43ea-8108-8c3818ac7103/2021-02-25_20.30.57/w=1920,quality=90,fit=scale-down)

# From circle to spiral

The circle sketches place each object the same distance from the center. `sin` and `cos` are defined to produce x, y pairs that are all a distance of 1.0 from the origin; multiplying them both by 150 makes everything a distance of 150 pixels from the origin. Instead of multiplying each `sin` and `cos` by 150, multiple them by larger and larger numbers as the angle increases. This creates a spiral.

Copy

```javascript

void draw() {
	for (int i = 0; i <= 360; i += 10) {
		float angle = radians(i);
		float radius = map(i, 0, 360, 10, 200) + 100;
		float x = 250 + radius * cos(angle);
		float y = 300 + radius * sin(angle);
		
		if (i % 40 == 0) {
			fill(0);
		} else {
			fill(255);
		}
		if (i == 90) {
			strokeWeight(5);
		} else {
			strokeWeight(1);
		}
		circle(x, y, 80);
	}
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/c0317b7c-c7c6-40da-937c-bc542e7cbbd9/Untitled/w=1920,quality=90,fit=scale-down)

Increasing the angle to 720 degrees to wrap around the circle twice (2∗3602 \* 3602∗360).

Copy

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/53161b21-cc03-4631-8411-96676e858556/Untitled/w=1920,quality=90,fit=scale-down)

Original p5.js version ©2020–2022 by Oliver Steele. Updated for Processing by Margaret Minsky.
