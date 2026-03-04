---
title: "Properties of Electronic Components"
layout: ../../../layouts/BaseLayout.astro
---

![Properties of Electronic Components](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/d44a0fa1-5bd6-4ba2-9b33-b0a9922b164d/Electronic-components/w=1920,quality=90,fit=scale-down)

A variety of sensors (and other components) are available from the ER (and from shops). In order to make sense of the choices, it is useful to ask:

-   _**What does it sense?**_ For example, acceleration (and therefore angle relative to the ground, when it is held still), magnetic field?
-   What is its _**physical interface**_ (how do you create an mechanical connection)? Some possibilities include:

-   A [_**through-hole component**_](https://www.build-electronic-circuits.com/through-hole-components/) has pins or wires that can be inserted directly into a protoboard. If the component has wires, they can be inserted into the headers on your Arduino.

[![Image source: ](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/7c98d7a8-78eb-4dd3-bf3a-28e53dee3abf/components-1/w=1920,quality=90,fit=scale-down)](/Image%20source:%20https://www.build-electronic-circuits.com/category/basic-electronics/)

-   Some components have _**female headers**_, that you can stick a wire into. Your Arduino is an example of this.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/bf325afb-2f15-4eb9-b58c-261a10d672d5/DFR0181/w=1920,quality=90,fit=scale-down)

-   Some components have _**sockets**_, that a cable plugs into. There are a variety of different socket types. See the note about Grove components, below.

![image](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/40c60ae8-f4bf-460f-a970-bce814841aca/SEN0287/w=1920,quality=90,fit=scale-down)

-   What is its _**logical interface**_? Some possibilities are _analog_, _serial_, [I2C](https://en.wikipedia.org/wiki/I²C), [SPI](https://en.wikipedia.org/wiki/SPI), and [1-Wire](https://en.wikipedia.org/wiki/1-Wire). The Arduino supports all of these. Some require libraries, that you can download and install.
-   Is there _**documentation**_? Is there example code for the Arduino?
-   _**How large**_ is the component? How will you attach it to your project?
-   _**How much power**_ does the component require? What voltage does it _**require**_, and what voltage can it _**tolerate**_? Can your Arduino supply this much power, or do you need another source?
-   If the device uses a digital interface (anything bug analog), does it use _**5V or 3.3V logic**_?

# Breakout Boards

Some components need to be soldered. The units from the equipment room are not in this category. Surface-Mount Devices (SMDs) that would otherwise need to be soldered, instead come already soldered to breakout boards, which include holes that can be clipped to, male headers (so that they can be inserted into a protoboard), include female headers, or sockets.

The actual sensor or integrated circuit is made by one company. Another company, generally a hobbyist supplier such as Adafruit or Sparkfun (in the U.S.), Seeed (in Europe), or DFRobot (in Shanghai), solders this to a small PC board so that it is easier for a hobbyist or artist to work with. A third company then sells this to individuals. Often, the second and third company are the same.

For example, the BNO055 IMU ([![IMUs and Accelerometers](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/22dea760-bb39-4466-9d1e-6c41d75e369f/bno055-9-dof-absolute-orientation-imu/w=1920,quality=90,fit=scale-down)IMUs and Accelerometers](/physical-computing/imus-and-accelerometers/)) is made by Bosch. Adafruit and Seeed Studio each make a breakout board that includes the BNO055. Adafruit sells the Adafruit version in the U.S. Seeed Studio sells their own version, which uses the “Grove” brand, outside China; DFRobot re-sells the Grove BNO055 breakout board in China and internationally. The boards use the same integrated circuit sensor and the same libraries and code work for both, but they are physically different (the Adafruit BNO055 is a through-hole component; the Grove version uses the Grove socket and cable). You can also buy the Adafruit and DFRobot from other suppliers, although some copies from other suppliers are copies, and are defective in various ways.

Also see:

[

##### Breakout Boards in Electronics

Prototyping and developing new Embedded Electronics becomes easier than ever due to the help of breakout boards. Lot of easy to Interface breakout boards are manufactured by different companies and they provide library file for that breakout board component or sensor to make it very easy to interface and program with microcontrollers & micro controller development platforms. What is Breakout Board?

![](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/ddf35714-5335-49aa-a0db-8da648352d47/fevicon/w=1920,quality=90,fit=scale-down)

theorycircuit.com

![Breakout Boards in Electronics](https://images.spr.so/cdn-cgi/imagedelivery/j42No7y-dcokJuNgXeA0ig/b5a65ed7-3bd6-40ea-90e1-e72e6cbd7660/breakout-boards/w=1920,quality=90,fit=scale-down)

](https://theorycircuit.com/breakout-boards-electronics/)
