---
title: "Properties of Electronic Components"
layout: ../../../layouts/BaseLayout.astro
---

A variety of sensors (and other components) are available from the ER (and from shops). In order to make sense of the choices, it is useful to ask:

- ***What does it sense?*** For example, acceleration (and therefore angle relative to the ground, when it is held still), magnetic field?
- What is its ***physical interface*** (how do you create an mechanical connection)? Some possibilities include:
    - A [***through-hole component***](https://www.build-electronic-circuits.com/through-hole-components/) has pins or wires that can be inserted directly into a protoboard. If the component has wires, they can be inserted into the headers on your Arduino.
        
        ![Image source: [https://www.build-electronic-circuits.com/category/basic-electronics/](https://www.build-electronic-circuits.com/category/basic-electronics/)](/images/properties-of-electronic-components/properties-of-electronic-components-03.jpg)
        
        Image source: [https://www.build-electronic-circuits.com/category/basic-electronics/](https://www.build-electronic-circuits.com/category/basic-electronics/)
        
    - Some components have ***female headers***, that you can stick a wire into. Your Arduino is an example of this.
        
        ![DFR0181.jpg](/images/properties-of-electronic-components/properties-of-electronic-components-01.jpg)
        
    - Some components have ***sockets***, that a cable plugs into. There are a variety of different socket types. See the note about Grove components, below.
        
        ![SEN0287.jpg](/images/properties-of-electronic-components/properties-of-electronic-components-02.jpg)
        
- What is its ***logical interface***? Some possibilities are *analog*, *serial*, [I2C](https://en.wikipedia.org/wiki/I²C), [SPI](https://en.wikipedia.org/wiki/SPI), and [1-Wire](https://en.wikipedia.org/wiki/1-Wire). The Arduino supports all of these. Some require libraries, that you can download and install.
- Is there ***documentation***? Is there example code for the Arduino?
- ***How large*** is the component? How will you attach it to your project?
- ***How much power*** does the component require? What voltage does it ***require***, and what voltage can it ***tolerate***? Can your Arduino supply this much power, or do you need another source?
- If the device uses a digital interface (anything bug analog), does it use ***5V or 3.3V logic***?

# Breakout Boards

Some components need to be soldered. The units from the equipment room are not in this category. Surface-Mount Devices (SMDs) that would otherwise need to be soldered, instead come already soldered to breakout boards, which include holes that can be clipped to, male headers (so that they can be inserted into a protoboard), include female headers, or sockets.

The actual sensor or integrated circuit is made by one company. Another company, generally a hobbyist supplier such as Adafruit or Sparkfun (in the U.S.), Seeed (in Europe), or DFRobot (in Shanghai), solders this to a small PC board so that it is easier for a hobbyist or artist to work with. A third company then sells this to individuals. Often, the second and third company are the same.

For example, the BNO055 IMU ([IMUs and Accelerometers](/physical-computing/imus-and-accelerometers/)) is made by Bosch. Adafruit and Seeed Studio each make a breakout board that includes the BNO055. Adafruit sells the Adafruit version in the U.S. Seeed Studio sells their own version, which uses the “Grove” brand, outside China; DFRobot re-sells the Grove BNO055 breakout board in China and internationally. The boards use the same integrated circuit sensor and the same libraries and code work for both, but they are physically different (the Adafruit BNO055 is a through-hole component; the Grove version uses the Grove socket and cable). You can also buy the Adafruit and DFRobot from other suppliers, although some copies from other suppliers are copies, and are defective in various ways.

Also see:

[Breakout Boards in Electronics](https://theorycircuit.com/breakout-boards-electronics/)
