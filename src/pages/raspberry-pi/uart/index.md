---
title: "UART"
layout: ../../../layouts/BaseLayout.astro
---

From [Teach Micro](https://www.teachmemicro.com/raspberry-pi-serial-uart-tutorial/):

The Raspberry Pi UART transmit (TXD) and receive (RXD) pins are assigned to GPIO14 and GPIO15 respectively.

The PL011 UART is the main UART for models without Bluetooth feature and is tied directly to the Linux console output. This means you can send Linux commands from your PC to the Raspberry Pi on this UART.

On the other hand, the mini UART becomes the Linux console UART for models with Bluetooth like the Raspberry Pi 3 and Raspberry Pi Zero W. For these models, the PL011 UART is tied directly to the Bluetooth module.

Whichever UART is assigned to the Linux console is accessible through /dev/serial0. Each UART can be accessed individually via /dev/ttyS0 for the mini UART and /dev/ttyAMA0 for the PL011 UART.

Generally, the PL011 UART is more reliable than the mini UART because the latter has smaller [FIFOs](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)), lacks flow control and has its baud rate reliant on the [VPU](https://en.wikipedia.org/wiki/Graphics_processing_unit) clock speed.

By default, the Pi’s UART uses the following parameters: 115200 baud, 8 bits, no parity, 1 stop bit and no flow control.

# Couple / Uncouple UART from Console

`sudo raspi-config`

8 Advanced Options > A8 Serial > Would you like a login shell to be accessible over serial?

```python
import serial
ser = serial.Serial(            
     port='/dev/serial0',
     baudrate = 9600,
     parity=serial.PARITY_NONE,
     stopbits=serial.STOPBITS_ONE,
     bytesize=serial.EIGHTBITS,
     timeout=1
 )
```
