---
title: "JavaScript Iteration Methods"
layout: ../../../layouts/BaseLayout.astro
---

The [JavaScript Array iteration methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#Iteration_methods) operate on all the elements of an array. 

The following examples compare the iteration methods, that take a function as an argument, to `for` loops, where the code that is applied to each element is in the body of the `for` loop.

# Functions

The examples use the *arrow syntax*.

### Arrow syntax

*Single parameter*

### `function` Syntax

```jsx
name => { console.info(name); }
```

```jsx
name => console.info(name)
```

*Multiple parameters*

```jsx
function (name) {
	console.info(name);
}
```

```jsx
(name, i) => { console.info(i, ':', name); }
```

```jsx
(name, i) => console.info(i, ':', name)
```

```jsx
function (name, i) {
	console.info(i, ':', name);
}
```

# Array Methods

These examples assume the following definitions. `dayNames` is an Array of the names (Strings) of the days of the week. `stringLength` is a function that returns the length of a string.

```jsx
const dayNames = [
	"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function stringLength(str) {
	return str.length;
}
```

### *Using Array methods*

### *Using `for` loops*

## `array.forEach`

*What it does*: Do something (call a function *for its effect*) to each item in an array. Ignore the result.

```jsx
dayNames.forEach(name => console.info(name));
```

```jsx
for (let i = 0; i < dayNames.length; i++) {
	console.info(dayNames[i]);
}
```

Both of the snippets above print the following to the JavaScript console:

```
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

A variant uses the array index:

```jsx
dayNames.forEach((name, i) =>
	console.info('Day #' + (i + 1) + ' is ' + name));
```

```jsx
for (let i = 0; i < dayNames.length; i++) {
	console.info('Day #' + (i + 1) + ' is ' + dayNames[i]);
}
```

These snippets print the following:

```
1. Monday
2. Tuesday
3. Wednesday
4. Thursday
5. Friday
6. Saturday
7. Sunday
```

## `array.map`

*What it does*: Make a new array the same length as the original, by calling a function on each element in the original and collecting its return values.

```jsx
let lengths = dayNames.map(stringLength);

// lengths is now [6, 7, 9, 8, 6, 8, 6]
```

```jsx
let lengths = [];
for (let i = 0; i < dayNames.length; i++) {
	lengths[i] = stringLength(dayNames[i]);
}
```

As with `array.forEach`, you can also use the array index:

```jsx
let numberedNames = dayNames.map((name, i) =>
  `${i+1}. ${name}`)

// numberedNames is now ["1. Monday", "2. Tuesday", …]
```

```jsx
let lengths = [];
for (let i = 0; i < dayNames.length; i++) {
	lengths[i] = `${i+1}. ${name}`;
}
```

## `array.filter`

*What it does*: Make a new array that contain only those elements of the original that pass a test (result in a true-thy return value from the function).

```jsx
let longDayNames = dayNames.filter(name =>
	name.length >= 8)

// longDayNames is now ["Wednesday", "Thursday", "Saturday"]
```

```jsx
let longDayNames = [];
for (let i = 0; i < dayNames.length; i++) {
	const name = dayNames[i];
	if (name.length >= 8) {
		longDayNames.push(name);
	}
}
```

## `array.every`

*What it does*: Return true if and only if the function is true of every value in the array.

Set `startsWithS` to `true` if every element of the Array begins with the letter `"S"`. 

```jsx
const startsWithS = dayNames.every(name =>
  name[0] === "S");

// Not every day name starts with S, so
// startsWithS == false
```

```jsx
let startsWithS = true;
for (let i = 0; i < dayNames.length; i++) {
	if (!(dayNames[i][0] === "S")) {
		startsWithS = false;
		break;
	}
}
```

The second example uses a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions) to test whether the day name matches a pattern: in this case, the letters "day" followed by the end of the string. (`"$"` is regular-expression-speak for ”end of the string”.)

```jsx
const endsWithDay = dayNames.every(name =>
  name.match(/day$/));

// Every day name ends with "day", so
// endsWithDay == true
```

```jsx
let endsWithDay = true;
for (let i = 0; i < dayNames.length; i++) {
	if (!(dayNames[i][0].match(/day$))) {
		endsWithDay = false;
		break;
	}
}
```

## `array.some`

*What it does*: Return true if and only if the function is true of some value in the array.

```jsx
const startsWithS = dayNames.every(name =>
  name[0] === "S");

// Some day name starts with S, so
// startsWithS == true
```

```jsx
let startsWithS = false;
for (let i = 0; i < dayNames.length; i++) {
	if (dayNames[i][0] === "S") {
		startsWithS = true;
		break;
	}
}
```

```jsx
const startsWithDay = dayNames.every(name =>
  name.match(/^day/));

// No day name starts with "day", so
// startsWithDay == false
```

```jsx
let startsWithDay = false;
for (let i = 0; i < dayNames.length; i++) {
	if (dayNames[i][0].match(/^day))) {
		startsWithDay = true;
		break;
	}
}
```

# Notes

The primary advantages of the iteration methods over `for` loops are:

- They are *expressions*, that can be used directly in positions where a value is required (for example, inside `{ }` in React).
- They *nest* (you can include one inside of another), without your having to worry about whether the iteration variable (`i` in the examples) in the *inner* iterator is distinct from the iteration variable in the *outer* iterator. Otherwise it is easy to get in trouble with code like the following (do you see the typo?):
    
    ```jsx
    for (let x = 0; x < width; x += 10) {
    	for (let y = 0; y < height; x += 10) {
    		// draw a rectangle
    	}
    }
    ```
