---
title: "Language Constructs"
layout: ../../../../layouts/BaseLayout.astro
---

# Cascading `if`

I might teach this indentation pattern for `if` when there’s more than two arms, as an alternative to actually nesting them. (The parse tree is still nested, but the indentation level isn’t.)

```cpp
if (expr == 1) {
  …
} else {
  if (expr == 2) {
    …
  } else {
    if (expr == 3) {
      …
    } else {
      …
    }
  }
}
```

⇒

```cpp
if (expr == 1) {
  …
} else if (expr == 2) {
  …
} else if (expr == 3) {
  …
} else {
  …
}
```

# `switch` / `case`

I like to introduce `switch`  as an alternative to “chained” `if` statements:

```cpp
if (expr == 1) {
  …
} else if (expr == 2) {
  …
} else if (expr == 3) {
  …
} else {
  …
}
```

⇒

```
switch (expr) {
  case 1:
    …
    break;
  case 2:
    …
    break;
  case 3:
    …
    break;
  default:
    …
}
```

that has the advantages:

- Communicates the design intent – this is the most important
- Only evaluates `expr` once (doesn’t matter if `expr` is a variable)

Note: Having to use `break` (in C/C++/Arduino, but lots of other languages too) is a gotcha and an annoyance though.

Note: It took me decades to get straight that `switch` goes on the outside and `case` is the thing that goes inside. Then I made the mnemonic that there are a number of different cases, and I haven’t gotten confused since. (It’s so direct and obvious that it’s barely a mnemonic, but I needed it.) I think if I’d thought more about mechanical switches I could have used that as mnemonic too.

## The `else` is optional

In a chained `if`, the `else` is optional. In a `switch`/`case`, the `default` is optional.

```cpp
if (expr == 1) {
  …
} else if (expr == 2) {
  …
} else if (expr == 3) {
  …
}
```

```
switch (expr) {
  case 1:
    …
    break;
  case 2:
    …
    break;
  case 3:
    …
    break;
}
```

## Optional `break`

The `break` comes in handy when two (or more) cases share the same code:

```
if (expr == 1) {
  // executed when expr is 1
} else if (expr == 2 || expr == 3) {
  // executed when expr is 2 or 3
}
```

```
switch (expr) {
  case 1:
    // executed when expr is 1
    break;
  case 2:
  case 3:
    // executed when expr is 2 or 3
    break;
}
```
