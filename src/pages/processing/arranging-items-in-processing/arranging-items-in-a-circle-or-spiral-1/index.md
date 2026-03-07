---
title: "Arranging Items in a Circle or Spiral (Processing)"
layout: ../../../../layouts/BaseLayout.astro
---

# Review: Basic line

This code from [Arranging a Line of Items](https://creative-coding.osteele.com/arranging-items-in-a-line/) draws a line of shapes. It uses the *derivation* strategy, to calculate a value for x directly from i each time through the loop.

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

![Screenshot of Notion (4-7-22, 11-42-58 PM).png](/images/arranging-items-in-a-circle-or-spiral-1/Screenshot_of_Notion_%284-7-22_11-42-58_PM%29.png)

Note: From here on, the definition of `setup()` is not shown. Each of the following code samples assumes that the sketch also contains a `setup()` function:

```java
void setup() {
	size(600, 600);
}
```

# Using `sin` and `cos`

We can use the `sin()` or `cos()` functions to make the items swing between the top and bottom of the band, as the index value progresses.

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 20 + 50 * i;
		float y = 100 + 50 * sin(i);
		circle(x, y, 50);
	}
}
```

![Screenshot of Safari (4-7-22, 11-50-43 PM).png](/images/arranging-items-in-a-circle-or-spiral-1/Screenshot_of_Safari_%284-7-22_11-50-43_PM%29.png)

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 20 + 50 * i;
		float y = 100 + 50 * cos(i);
		circle(x, y, 50);
	}
}
```

![Screenshot of Safari (4-7-22, 11-51-20 PM).png](/images/arranging-items-in-a-circle-or-spiral-1/Screenshot_of_Safari_%284-7-22_11-51-20_PM%29.png)

Note: The sketches in this section end up computing `sin(0)`, `sin(1)`, `sin(2)`, all the way to `sin(9)`. The Processing `sin()` function actually takes radians, so typically a sketch would take much smaller steps. These large steps happen to draw sine waves anyway for complicated math-y reasons (because 1 and $pi$ are incommensurate), and this is just a step towards a sketch that will do things correctly anyway. So use the code in the section [Items in a circle](Arranging%20Items%20in%20a%20Circle%20or%20Spiral%20(Processing)%20dcdba7db5dc84cd48da39b419a0b0314.md) to copy from, not the sketches in this section.

Trying to use `sin` (or `cos`) for both x and y arranges the items on a diagonal line. This is true any time that x and y use the same equation, because then they will have the same value.

```java
void draw() {
  for (int i = 0; i < 10; i++) {
    float x = 100 + 50 * sin(i);
    float y = 100 + 50 * sin(i);
    circle(x, y, 50);
  }
}
```

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled.png)

The solution is to use `cos` for `x` and `sin` for `y`. These functions are cleverly designed so that using them together this way makes a circle.

Let’s look at just using `sin` for `y` (instead of `x`), and compare that to the code a couple of sketches above that uses `cos` for `x`.

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 100 + 50 * cos(i);
		float y = 100 + 50 * i;
		circle(x, y, 50);
	}
}
```

![Screenshot of Notion (4-7-22, 11-56-41 PM).png](/images/arranging-items-in-a-circle-or-spiral-1/Screenshot_of_Notion_%284-7-22_11-56-41_PM%29.png)

Combining `cos` for `x` with `sin` for `y` creates a circle.

```java
void draw() {
	for (int i = 0; i < 10; i++) {
		float x = 100 + 50 * cos(i);
		float y = 100 + 50 * sin(i);
		circle(x, y, 50);
	}
}
```

![Screenshot of Notion (4-8-22, 12-00-13 AM).png](/images/arranging-items-in-a-circle-or-spiral-1/Screenshot_of_Notion_%284-8-22_12-00-13_AM%29.png)

There’s two things that may be wrong with this circle, depending on your design intent: (1) it is too small relative to the items that are placed along its edge; and, the items are wrapped around the circle more than once.

The first problem can be addressed by changing the `50` in `50 * cos(i)` and `50 * sin(i)` to a larger number. We will also change the `100` in `100 + 50 * cos(i)` to a larger number, to move the center of the arrangement circle *right* so that the whole circle stays on the screen.

# Items in a circle

By default, `sin` and `cos` repeat every $2\pi$. We need to insure that the number that we putting into them varies from 0 to $2\pi$ by the time the loop is done. Since `i` varies from 0 to (just under) 10, `i * TWO_PI / 10` varies from 0 to (one step under) `TWO_PI`.

```jsx
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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 1.png)

Here is another way of doing this. `angleMode(DEGREES)` causes `sin` and `cos` to repeat every 360, instead of every $2\pi$.

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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 2.png)

Yet another way to do this is to increment the angle directly instead of computing it from the index position. This is useful if we know the number of degrees we want to leave between items, instead of the number of items.

```java
void draw() {
	for (float angle = 0; angle < 360; angle += 10) {
		float x = 250 + 150 * cos(radians(angle));
		float y = 300 + 150 * sin(radians(angle));
		circle(x, y, 50);
	}
}
```

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 3.png)

# Drawing some items differently

We can use a conditional in order to draw some items differently from others.

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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 4.png)

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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 5.png)

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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 6.png)

# Animating the circle

Incorporate the time (`millis()`) into the equation, in order to animate the circle.

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

![](/images/arranging-items-in-a-circle-or-spiral-1/2021-02-25_20.30.57.gif)

# From circle to spiral

The circle sketches place each object the same distance from the center. `sin` and `cos` are defined to produce x, y pairs that are all a distance of 1.0 from the origin; multiplying them both by 150 makes everything a distance of 150 pixels from the origin. Instead of multiplying each `sin` and `cos` by 150, multiple them by larger and larger numbers as the angle increases. This creates a spiral.

```jsx

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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 7.png)

Increasing the angle to 720 degrees to wrap around the circle twice ($2 * 360$).

```java
void setup() {
  size(600, 600);
}

void draw() {
  for (int i = 0; i < 720; i += 10) {
    float angle = radians(i);
    float radius = map(i, 0, 360, 10, 200);
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

![](/images/arranging-items-in-a-circle-or-spiral-1/Untitled 8.png)

---

Original p5.js version ©2020–2022 by Oliver Steele. Updated for Processing by Margaret Minsky.
