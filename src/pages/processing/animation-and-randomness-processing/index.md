---
title: "Animation and Randomness (Processing)"
layout: ../../../layouts/BaseLayout.astro
---

-   [
    
    Time-Based Animation
    
    ](#block-91768fb811724f63acb660ab0eb37a15)
-   [
    
    Random
    
    ](#block-1065ce71e68e47e1aa176f322cad9943)
-   [
    
    Update-Based (or Implicit) Animation
    
    ](#block-8af24894358947d7b14f2137eeba8bbd)
-   [
    
    Noise
    
    ](#block-3ae532c935004108a163256e1c0b17f6)
-   [
    
    Theory: Sources of change
    
    ](#block-8763bfd39bd54485a4bfc545518b1b9d)

# Time-Based Animation

We can make the sketch _animate_ by using _time as an input_. Modify `y` so that it is a function of time (`millis()`). This causes the sketch to animate.

Copy

```java
void setup() {
  size(600, 600);
}

void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float y = map(sin(i + millis() / 100), -1, 1, 80, 120);
    circle(x, y, 20);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/59a961ad-2318-4098-a3d8-893c705a7293/CleanShot_2022-04-08_at_09.32.17/w=1920,quality=90,fit=scale-down)

Remember that the mathematical sin() function has an _output range_ between -1.0 and 1.0, so we need to map it to some larger value range for the y’s so that we can see circles move. Thus, we use the `map()` function.

Note: Now that the circles are drawn in a different position each time `draw()` is called, it is important to clear the canvas (`background(100)`) at the beginning of `draw()`. Otherwise each circle will be drawn on top of all the circles drawn by previous calls to `draw()`. In all the sketches so far we have drawn the background once in `setup()`, and since all the circles were drawn at the same position, this was not detectable. Now, we have moved the call to `background()` into `draw()`.

Try this: Change the sketch to animate the size of the object, instead of its position. You can base your work on this sketch and a one in XXX.

# Random

The previous sketch uses _time_ to drive one of the shape’s properties (its vertical position). Let’s use `random()` instead.

Copy

```java
void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float y = random(80, 120);
    circle(x, y, 20);
  }
  noLoop();
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/77e94bac-0c18-4bae-9a62-9f4713dcb559/Screenshot_of_Safari_(4-8-22_11-23-20_AM)/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/96a3aa20-7467-4045-a5fc-6be8086b0cf7/Screenshot_of_Safari_(4-8-22_11-23-34_AM)/w=1920,quality=90,fit=scale-down)

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/45a240ab-ca7a-48eb-99f8-4098fda00c06/Screenshot_of_Safari_(4-8-22_11-24-00_AM)/w=1920,quality=90,fit=scale-down)

Note: There are _three_ screenshots next to the code, to show that the `random()` returns a different sequence of values, and therefore the sketch draws a different image, each time it is run.

The `noLoop()` function prevents `draw()` from being called more than once. Let’s see what would happen if we removed it.

Copy

```java
void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float y = random(80, 120);
    circle(x, y, 20);
  }
 
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/cb68f7d8-06a9-4514-883a-90afddb207bf/CleanShot_2022-04-08_at_11.28.41/w=1920,quality=90,fit=scale-down)

Aargh! Just as the previous sketch drew the circles at different positions each time it was run, this one draws them at different positions _every frame_.

What if we want to remember the position from frame to frame, so that we can draw the circles at the same position each time (or, move them in a more organized way that incorporates their previous position)?

In Processing, the way to _remember_ things is to use a _variable_. A variable can hold a single value, but we want to remember several values: the vertical position of each circle. The trick is that the single value that the variables holds can be an array, which itself holds several values. Here’s what it looks like to use an array to hold the y values, inside `draw()`.

Copy

```java
void draw() {
  background(100);

  float ys[] = new float[20];

  for (int i = 0; i < 20; i++) {
    ys[i] = random(80, 120);
  }

  for (int i = 0; i < 20; i++) {
    int x = 10 + 50 * i;
    circle(x, ys[i], 20);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/8fcdd833-679f-4474-89da-8d9440e11232/CleanShot_2022-04-08_at_11.28.41/w=1920,quality=90,fit=scale-down)

Note: Processing needs to know how many elements are in the array when it is created, thus we need to say `new float[20]`, however there are ways to change the length of the array later if needed.

As you can see above, simply using an array as intermediary doesn’t help with the jitter if the array is still initialized on each call to `draw()`. Each call to `draw()` makes a _new_ array, stores it in a _new_ variable named `ys`, and fills the array with a new set of random numbers.

To get a stable array that can be seen from all the calls to `draw()` make the array a global variable, and initialize it in `setup()` instead of `draw()`.

Copy

```java
float ys[] = new float[20];

void setup() {
  size(600, 600);

  for (int i = 0; i < 20; i++) {
    ys[i] = random(80, 120);
  }
}

void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    int x = 10 + 50 * i;
    circle(x, ys[i], 20);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/4e6d01a0-0364-4da8-af07-cbca794ec6c5/Screenshot_of_Safari_(4-8-22_11-23-20_AM)/w=1920,quality=90,fit=scale-down)

Now we can combine this with time-based animation, to get an effect that uses both randomness (from `random()` in `setup()`) and time (from `millis()` in `draw()`), without getting new random numbers every frame.

Copy

```java
void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float size = map(sin(i + millis() / 100), -1, 1, 10, 20);
    circle(x, ys[i], size);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/57adf660-8a8b-4f3f-a1de-49735bcb06f6/CleanShot_2022-04-08_at_11.47.03/w=1920,quality=90,fit=scale-down)

# Update-Based (or Implicit) Animation

An alternative to time-based animation is to modify (or update) some values each time `draw()` is called.

The previous sketch initializes an array with random values, and then combines the values that it _reads_ from this array with an expression that uses time. This sketch doesn’t use time at all; instead it _writes_ to the array as well, so that the next frame can pick up where this frame left off.

Copy

```javascript
float ys[] = new float[20];

void setup() {
  size(600, 600);

  for (int i = 0; i < 20; i++) {
    ys[i] = random(80, 120);
  }
}

void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    circle(x, ys[i], 20);
    ys[i] += random(1);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ea3633db-9fe6-42ad-ac12-57dc65361022/CleanShot_2022-04-08_at_12.44.37/w=1920,quality=90,fit=scale-down)

# Noise

Randomness is good for organic or interesting patterns. Continuity and stability are necessary for smooth, pleasant animation. Storing the random values in an array is one way to combine randomness with continuity.

Another is to use the `noise()` function. Like `random()`, `noise()` returns values that don’t seem to have much to do with each other, at least when its arguments are far apart (as they are in the next sketch). Unlike `random()`, `noise()` returns the same values each time you call it with the same arguments.

Here’s the sketch from the [Random section](/processing/animation-and-randomness-processing/) above, with `random()` replaced by `noise()`. Unlike the first sketch in Random, we don’t need `noLoop()` to keep the drawing from flickering: since for each circle `noise()` is called with the same input (`i`), its value is the same, and `draw()` draws the same thing from frame to frame.

Copy

```java
void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float y = map(noise(i), 0, 1, 80, 120);
    circle(x, y, 20);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/feb86ea2-a589-454e-8439-b3cd46def859/Screenshot_of_Safari_(4-8-22_12-21-50_PM)/w=1920,quality=90,fit=scale-down)

Note: `noise()` returns a value between 0 and 1, like `random()` with no arguments. To make it behave like `random(80, 120)`, we must use `map()` or write our own version of this arithmetic.

`noise()` can take up to three values. We have used one: the index of the circle within the line of circles. Add a second argument to `noise()`, so that its output is based on the time, as well as on the circle’s index (`i`).

Fun Note: The `noise()`function’s algorithm for making organic, useful, coherent noise was invented by NYU Prof. Ken Perlin in 1983 to introduce nature-like effects such as fire and water into what had been a more machine-like appearance of computer graphics at the time. He was [awarded an Oscar(tm)](https://cs.nyu.edu/~perlin/doc/oscar.html) for this achievement for the movies, and as he says in the linked article, his “Mom was very happy”. You can read more [here](https://en.wikipedia.org/wiki/Perlin_noise). Perlin noise has been used in almost every CGI film made, and it is also now the staple form of noise supplied in programming language primitives such as in Processing.

Copy

```java
void draw() {
  background(100);

  for (int i = 0; i < 20; i++) {
    float x = 10 + 50 * i;
    float y = map(noise(i, millis() / 1000.0), 0, 1, 80, 120);
    circle(x, y, 20);
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/c595e3b7-9f44-4af0-a653-5b987a13c501/CleanShot_2022-04-08_at_12.28.23/w=1920,quality=90,fit=scale-down)

Note that we need to use `1000.0` again, instead of 1000, to keep smoothness from decimal (float) numbers. `noise()` returns values that are close together when its inputs are close together. (It is kind of like a cross between `random()` and `sine()`. ) The successive values for `i` from item to item are far apart, so there’s not any continuity between the first and the second element. The successive values of `millis() / 1000` are close together from one call to `draw()` to the next so there is continuity from frame to frame, resulting in a smooth animation. (This is why we divide `millis()` by 1000.0 The value of `millis()` itself changes too much from one frame to the next; this is how we slow it down.)

# Theory: Sources of change

In order to draw a _different image each frame_, `draw()` needs access to something that has a _different value_ each time `draw()` is called. Here are some possibilities:

-   _**Time**_. In p5.js, the `frameCount` function and the `millis()` variable are the sources of time. We explored that in Time-Based Animation.
-   A _**global variable**_. You can define your own variable that has global scope (is defined outside of `setup()` and `draw()`), and use it to remember changes from one frame to the next. There was an example of this in Update-Based Animation.
-   _**Randomness**_. The `random()` function returns a different number each time you use it. This will a frame that calls `random()` to draw differently each frame. There were an examples of this in Random and Noise.
-   _**Computer peripherals**_. Input devices that are connected to or built into the computer include the mouse, keyboard, webcam, and microphone.
-   Other _**connections to the outside world**_. These can come from an Arduino or other device connected on the USB serial port, or from the internet.

This page explored the first three of these.

Original p5.js version ©2020–2022 by Oliver Steele. Updated for Processing by Margaret Minsky.
