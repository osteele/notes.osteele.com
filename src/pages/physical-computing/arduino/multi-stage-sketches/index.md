---
title: "Multi-Stage Sketches"
layout: ../../../../layouts/BaseLayout.astro
---

🎦

-   [
    
    Introduction
    
    ](#block-49ad9bdaac5f4158b28d2e256f796c0d)
-   [
    
    Combining Sketches into Stages
    
    ](#block-6f14197ea411479f9fabef1e7da97e89)
-   [
    
    Anatomy of a Sketch
    
    ](#block-8f107de149404311ac368624a4fba083)
-   [
    
    The Merge
    
    ](#block-2944616602ea4ba6b668199d3ccafd9c)
-   [
    
    Combine the circuits
    
    ](#block-0957a06cbe704d5a86634da7dde31432)
-   [
    
    Rename variables
    
    ](#block-5fe2ed82ff894574bed07e26713c492f)
-   [
    
    Combine the #include statements
    
    ](#block-94e6a8d8a3f14310a8d205199a4e5c4d)
-   [
    
    Combine the variable declarations
    
    ](#block-a7a2dd0be75e46a48bf04f53078fd6cd)
-   [
    
    Introduce a Stage variable
    
    ](#block-c81dedc84ce8468ba85c105d7ece062b)
-   [
    
    Combine the setup()s
    
    ](#block-8d97948467e140bf8a78409512596bbe)
-   [
    
    Rename each loop() functions to → stagen()
    
    ](#block-b5f59f6820d74d56836625ada8ffad71)
-   [
    
    The Final Sketch
    
    ](#block-847cf38d4d494a97ac52a8ac1a7fafaa)
-   [
    
    Appendix: The Non-Stage Version
    
    ](#block-a4c2b1f21ded414e8d80e8b8b1d2d18c)

# Introduction

Here’s a sketch with three different _**stages**_. Each stage acts like a mini-sketch. It has its own _behavior_, and is implemented by its own code_._ There is a _rule_ for when to change to a different stage.

The program’s knowledge of which stage it is in at the moment is part of its _program state_. This state is stored in a _variable_ (`stage`).

This particular sketch could be written more simply, by putting everything inside of `loop()`. (There is an example of this at the end of this document.) This is because each of the stages is very simple. This _pattern_ also works for larger and more complicated sketches, though.

Copy

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/dea271e6-0e8e-4ae4-9f8a-2fe7ae88cfd4/Screenshot_of_Safari_(3-17-22_10-23-42_PM)/w=1920,quality=90,fit=scale-down)

# Combining Sketches into Stages

## Anatomy of a Sketch

A sketch has these parts:

1.  Include statements `#include`
2.  Variable declarations
3.  `setup()`
4.  `loop()`
5.  other functions

Merge each of these sections. For example, combine the variable declarations from the source sketches into the variable declaration section of the combined sketch. (The next subsection will illustrate this.)

## The Merge

The example at the top of the page has three stages. For this example, of how to combine sketches into a single multi-stage sketch, we’ll combine just two sketches:

-   In sketch 1 (which will become stage one of the combined sketch), the LED is on. Pressing the button prints “stage 2” to the serial port, but we will change this to set the stage to stage 2.
-   In sketch 2 (which will become stage one of the combined sketch), the LED is off. Releasing the button prints “stage 2” to the serial port, but we will change this to set the stage to stage 1.

Copy

```arduino
// sketch 1
const int PIN_LED = 13;
const int PIN_BUTTON = 5;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 2");
    // TODO: set to stage 2
  }
}
```

Copy

```arduino
// sketch 2
const int PIN_LED = 13;
const int PIN_BUTTON = 5;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/971e1205-e0dd-4448-b976-8aff4426bf6d/Screenshot_of_Safari_(3-17-22_10-23-47_PM)/w=1920,quality=90,fit=scale-down)

### Combine the circuits

Sketch 1 and sketch 2 each require a circuit with a button and an LED. To combine them, we need to decide: do they use the _same_ button or two _different_ buttons. Do they use the same LED or two different LEDs?

There’s no right answer to this question – it depends on the _design intent_ for the combined sketch.

For this example, let’s decide:

-   The stages will use the same button
-   The stages will use two different LEDs

(We could repeat this exercise with different choices for these answers, to create \[slightly different\] code for the combined sketch.)

### Rename variables

Sketch 1 is written for a button on pin 5. Sketch 2 is also written for a button on pin 5. Since (we have decided that) in the combined sketch these are _different buttons_, we need to modify one of the sketches to use a different pin. We will modify sketch #2. The only change is the value of `PIN_BUTTON`.

Copy

```arduino
// sketch 2
const int PIN_LED = 13;
const int PIN_BUTTON = 6;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

Now, there is a problem that `PIN_BUTTON` is sketch 1 has one value (and refers to one pin), and the variable with the same name, `PIN_BUTTON`, in sketch 2 has a different value (and refers to a different pin). We can’t merge them, because they use the same variable in conflicting ways. To fix this, rename `PIN_BUTTON` in sketch #2. \[We could rename it in sketch 1, sketch 2, or in both sketches – so long as we don’t rename both sketches’ variable to the same new name.\]

Copy

```arduino
// sketch 2
const int PIN_LED = 13;
const int PIN_BUTTON_2 = 6;

void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON_2, INPUT);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON_2) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

We can tell from the code that both sketch 1 and sketch 2 are written to use an LED on pin 13. They also use the same variable name, `PIN_LED`, to refer to that pin. Since in the combined sketch, the sketch 1 (stage 1) LED and the sketch 2 (stage 2) LED are _the same LED_, that’s fine – we don’t need to do any further preparation to merge the sketches.

### Combine the `#include` statements

In these sketch, there are no `#include` statements, so there won’t be any `#include` statements in the combined program either.

### Combine the variable declarations

The first step is to simply append the declarations from sketch 1 and the declarations from sketch 2.

Copy

```arduino
// sketch 1
const int PIN_LED = 13;
const int PIN_BUTTON = 5;

// sketch 2
const int PIN_LED = 13;
const int PIN_BUTTON_2 = 6;
```

Now eliminate the duplicates. `PIN_LED` is defined twice, with the same value. (If it were defined with two different values, that means that we didn’t prepare the sketches correctly, by renaming variables that appeared in both.) We will also update the comments about which sketch each block of declarations came from, but it would be reasonable to remove the entirely.

Copy

```arduino
const int PIN_LED = 13;

// stage 1
const int PIN_BUTTON = 5;

// stage 2
const int PIN_BUTTON_2 = 6;
```

### Introduce a Stage variable

Copy

```arduino
const int PIN_LED = 13;

// stage 1
const int PIN_BUTTON = 5;

// stage 2
const int PIN_BUTTON_2 = 6;

int stage = 1;
```

### Combine the `setup()`s

Copy

```arduino
// sketch 1
void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_LED, OUTPUT);
}
```

Copy

```arduino
// sketch 2
void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON_2, INPUT);
  pinMode(PIN_LED, OUTPUT);
}
```

Copy

```arduino
void setup() {
  // sketch 1
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_LED, OUTPUT);

  // sketch 1
  Serial.begin(9600);
  pinMode(PIN_BUTTON_2, INPUT);
  pinMode(PIN_LED, OUTPUT);
}
```

Some things aren’t necessary to do twice. Remove the duplicates:

Copy

```arduino
void setup() {
  Serial.begin(9600);
  pinMode(PIN_BUTTON, INPUT);
  pinMode(PIN_BUTTON_2, INPUT);
  pinMode(PIN_LED, OUTPUT);
}
```

### Rename each `loop()` functions to → `stage`_`n`_`()`

Copy the `loop()` functions from the separate sketches into the combined sketch, and rename them to `stage1()`, `stage2()`, etc.

Copy

```arduino
// sketch 1
void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 2");
    // TODO: set to stage 2
  }
}
```

Copy

```arduino
// sketch 1
void stage1() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 2");
    // TODO: set to stage 2
  }
}
```

Copy

```arduino
// sketch 2
void loop() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON_2) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

Copy

```arduino
// sketch 2
void stage2() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON_2) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

Put them all into the merged sketch:

Copy

```arduino
void stage1() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 2");
    // TODO: set to stage 2
  }
}

void stage2() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON_2) == HIGH) {
    Serial.println("move to stage 1");
    // TODO: set to stage 1
  }
}
```

Find the places where the program should switch to a different stage, and add to each of these a statement that assigns the new stage number to the `stage` variable.

Copy

```arduino
void stage1() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON) == HIGH) {
    Serial.println("move to stage 2");
    stage = 2;
  }
}

void stage2() {
  digitalWrite(PIN_LED, HIGH);
  if (digitalRead(PIN_BUTTON_2) == HIGH) {
    Serial.println("move to stage 1");
    stage = 1;
  }
}
```

Add a _new_ loop function, that calls each of the `stage`_`n`_`()` functions, no matter how many there are. (In our case there are two.)

Copy

```arduino
void loop() {
  switch (stage) {
    case 1:
      stage1();
      break;
    case 2:
      stage1();
      break;
  }
}
```

## The Final Sketch

The combined, multi-stage sketch.

Copy

# Appendix: The Non-Stage Version

Here is the sketch from the example at the top of the page, rewritten not to use a `stage` variable. Instead of using a _variable_ to represent the current stage, as the first example did, this sketch uses the line of code that is being executed to represent the stage. While the Arduino is executing code in the first stanza (the first four non-comment lines) of `loop()` the sketch is in stage 1. While it is executing code in the second stanza, the sketch is in stage 2. While it is executing code in the third stanza, the sketch is in 3. Then the Arduino stops executing at the end of `loop()`, and starts again at the beginning, so that it is back in stage 1.

This version is easier to understand. However, it can only accommodate simple rules for getting from one stage to another. And, it can be more difficult to combine contributions from multiple people, if the code is combined into one function like this.

Copy

©2020–2022 by Oliver Steele.
