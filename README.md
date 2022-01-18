# Wokwi GDB Server

> Debug Arduino Code running in the Wowki Simulator using GDB

## Install & Run

1. Install [Node.js](https://nodejs.org/en/) version 12 or later. You can confirm your Node.js version by running: `node -v`.
2. Clone this respository to a local directory
3. Run `npm install`
4. Run `npm start`

## Connecting from the Wokwi Simulator

1. Open any Arduino project on [wokwi.com](wokwi.com), e.g. [blink](https://wokwi.com/arduino/libraries/demo/blink), and start the simulation.
2. In the code editor, press "F1" and select "Open Debug Web Socket".
3. You'll see a prompt asking for a URL to connect to. Confirm the default URL.

## Connecting from GDB

You'll need to use a GDB build that works with the architecture you are debugging. For instance, debugging Arduino requires avr-gdb (`apt install gdb-avr` on Ubuntu). You can find a pre-built Windows binary inside [this package](http://downloads.arduino.cc/tools/avr-gcc-7.3.0-atmel3.6.1-arduino5-i686-w64-mingw32.zip).

1. Start gdb
2. Write: `target remote localhost:3555`

That's it! You can now debug the simulated code using GDB. Here are some quick commands to get you started:

- `stepi` - Execute the next instruction
- `c` - Continue running the program (press Ctrl+C to break)
- `print $sp` - Prints the value of the Stack Pointer (SP)
- `where` - Show stack trace
- `set $r10 = 5` - Change the value of the R10 register
- `disas $pc, $pc+16` - Disassemble the next few instructions
- `info registers` - Dump all registers (r0-r31, SREG, SP, pc)

For more useful commands, check the [AVR GDB Cheatsheet](https://blog.wokwi.com/gdb-avr-arduino-cheatsheet/)

## Debugging with Symbols

If you want source-level debugging (with symbols and everything), first
build an ELF file for your program locally (e.g. using the Arduino CLI).
Then, push it to the simulator using GDB's `load` command, and load the
symbols using the `symbol-file` command. Finally, set `$pc` to 0 and 
start the program. Here's an example for such session:

```
(gdb) target remote localhost:3555
Remote debugging using localhost:3555
0x000001b6 in ?? ()
(gdb) load blink.ino.elf
Loading section .text, size 0x3a4 lma 0x0
Start address 0x0, load size 932
Transfer rate: 91 KB/sec, 932 bytes/write.
(gdb) symbol-file blink.ino.elf
Reading symbols from blink.ino.elf...done.
(gdb) set $pc=0
(gdb) stepi
0x000000b8 in __init ()
(gdb)
```

## License

Copyright (C) 2020 Uri Shaked. The code is released under the terms of the MIT license.
