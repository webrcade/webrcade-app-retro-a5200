import {
  Controller,
  Controllers,
  KeyCodeToControlMapping,
  RetroAppWrapper,
  ScriptAudioProcessor,
  Unzip,
  VisibilityChangeMonitor,
  FetchAppData,
  CIDS,
  KCODES,
  LOG,
} from '@webrcade/app-common';

const JST_UP = 0x0100;
const JST_RIGHT = 0x0200;
const JST_DOWN = 0x0400;
const JST_LEFT = 0x0800;
const JST_TOP_FIRE = 0x4000;
const JST_BOTTOM_FIRE = 0x0040;
const JST_0 = 0x0001;
const JST_1 = 0x0002;
const JST_2 = 0x0003;
const JST_3 = 0x0004;
const JST_4 = 0x0005;
const JST_5 = 0x0006;
const JST_6 = 0x0007;
const JST_7 = 0x0008;
const JST_8 = 0x0009;
const JST_9 = 0x000A;
const JST_STAR = 0x000B;
const JST_POUND = 0x000C;
const JST_START = 0x000D;
const JST_PAUSE = 0x000E;
const JST_RESET = 0x000F;

const KEY_FLAG = 0x8000;
const SPACE_BAR = KEY_FLAG | 1;
const DIGIT_0 = KEY_FLAG | 2;
const DIGIT_1 = KEY_FLAG | 3;
const DIGIT_2 = KEY_FLAG | 4;
const DIGIT_3 = KEY_FLAG | 5;
const DIGIT_4 = KEY_FLAG | 6;
const DIGIT_5 = KEY_FLAG | 7;
const DIGIT_6 = KEY_FLAG | 8;
const DIGIT_7 = KEY_FLAG | 9;
const DIGIT_8 = KEY_FLAG | 10;
const DIGIT_9 = KEY_FLAG | 11;
const MINUS = KEY_FLAG | 12;
const EQUAL = KEY_FLAG | 13;

const BUTTONS = [
  { button: "a", cid: CIDS.A },
  { button: "b", cid: CIDS.B },
  { button: "x", cid: CIDS.X },
  { button: "y", cid: CIDS.Y },
  { button: "lb", cid: CIDS.LBUMP },
  { button: "rb", cid: CIDS.RBUMP },
  { button: "lt", cid: CIDS.LTRIG },
  { button: "rt", cid: CIDS.RTRIG },
];

const INPUTS = {
  "0": JST_0,
  "1": JST_1,
  "2": JST_2,
  "3": JST_3,
  "4": JST_4,
  "5": JST_5,
  "6": JST_6,
  "7": JST_7,
  "8": JST_8,
  "9": JST_9,
  "*": JST_STAR,
  "#": JST_POUND,
  "topfire": JST_TOP_FIRE,
  "bottomfire": JST_BOTTOM_FIRE,
  "start": JST_START,
  "pause": JST_PAUSE,
  "reset": JST_RESET
}

class AtariKeyCodeToControlMapping extends KeyCodeToControlMapping {
  constructor() {
    super({
      [KCODES.ARROW_UP]: CIDS.UP,
      [KCODES.ARROW_DOWN]: CIDS.DOWN,
      [KCODES.ARROW_RIGHT]: CIDS.RIGHT,
      [KCODES.ARROW_LEFT]: CIDS.LEFT,
      [KCODES.Z]: CIDS.A,
      [KCODES.A]: CIDS.X,
      [KCODES.X]: CIDS.B,
      [KCODES.S]: CIDS.Y,
      [KCODES.Q]: CIDS.LTRIG,
      [KCODES.W]: CIDS.LBUMP,
      [KCODES.E]: CIDS.RBUMP,
      [KCODES.R]: CIDS.RTRIG,
      [KCODES.SHIFT_RIGHT]: CIDS.SELECT,
      [KCODES.ENTER]: CIDS.START,
      [KCODES.ESCAPE]: CIDS.ESCAPE,
      // Direct keyboard mappings
      [KCODES.SPACE_BAR]: SPACE_BAR,
      [KCODES.DIGIT_0]: DIGIT_0,
      [KCODES.DIGIT_1]: DIGIT_1,
      [KCODES.DIGIT_2]: DIGIT_2,
      [KCODES.DIGIT_3]: DIGIT_3,
      [KCODES.DIGIT_4]: DIGIT_4,
      [KCODES.DIGIT_5]: DIGIT_5,
      [KCODES.DIGIT_6]: DIGIT_6,
      [KCODES.DIGIT_7]: DIGIT_7,
      [KCODES.DIGIT_8]: DIGIT_8,
      [KCODES.DIGIT_9]: DIGIT_9,
      [KCODES.MINUS]: MINUS,
      [KCODES.EQUAL]: EQUAL,
    });
  }
}

export class Emulator extends RetroAppWrapper {

  SAVE_NAME = 'sav';

  constructor(app, debug = false) {
    super(app, debug);

    window.emulator = this;

    this.keypad = [0, 0];
    this.keypadCount = [0, 0];
    this.keypadDown = [false, false];

    this.inputs = [0, 0];
    this.analog = [[0, 0, 0, 0], [0, 0, 0, 0]];

    this.audioStarted = 0;

    // Fractional sample carry (for 800.25)
    this.audioCarry = 0;

    this.total = 0;
    this.count = 0;

    this.audioCallback = (offset, length) => {
      // length = incoming frames (mono)
      //this.total += length;
      this.count++;

      if (this.count === 60) {
        //console.log("total:", this.total);
        this.total = 0;
        this.count = 0;
      }

      // ---- target frames this callback ----
      const exactFrames = 48015 / 60; // 800.25
      const framesWithCarry = exactFrames + this.audioCarry;
      const outFrames = Math.floor(framesWithCarry);
      this.audioCarry = framesWithCarry - outFrames;

      const inSamples = length;
      // new Uint8Array(window.Module.HEAP8.buffer, offset, 4096);
      const input = new Uint8Array(
        window.Module.HEAP8.buffer,
        offset,
        inSamples
      );

      // ---- output buffer (stereo interleaved) ----
      const outSamples = outFrames;
      const output = new Int8Array(outSamples);

      // ---- frame walking resampler (no timing drift) ----
      const step = length / outFrames;

      let srcFrame = 0;
      for (let i = 0; i < outFrames; i++) {
        const si = (srcFrame | 0);
        output[i]     = input[si];
        srcFrame += step;
      }

      this.total += (outSamples);

      this.audioProcessor.storeSoundCombinedInput(
        output,
        1,
        outSamples,
        0,
        255
      );
    };

    // this.audioCallback = (offset, length) => {
    //   this.total += length;
    //   this.count = this.count + 1;

    //   if (this.count === 60) {
    //     console.log("total: " + this.total);
    //     this.total = 0;
    //     this.count = 0;
    //   }

    //   audioArray = new Uint8Array(window.Module.HEAP8.buffer, offset, 4096);
    //   this.audioProcessor.storeSoundCombinedInput(
    //     audioArray, 1, length, 0, 255,
    //   );
    // };

    // Set defaults if applicable
    if (Object.keys(app.mappings).length === 0) {
      this.mappings = {
        "a": "bottomfire",
        "b": "topfire",
      }
    } else {
      this.mappings = app.mappings;
    }
  }

  JST_UP = JST_UP;
  JST_RIGHT = JST_RIGHT;
  JST_DOWN = JST_DOWN;
  JST_LEFT = JST_LEFT;
  JST_TOP_FIRE = JST_TOP_FIRE;
  JST_BOTTOM_FIRE = JST_BOTTOM_FIRE;
  JST_0 = JST_0;
  JST_1 = JST_1;
  JST_2 = JST_2;
  JST_3 = JST_3;
  JST_4 = JST_4;
  JST_5 = JST_5;
  JST_6 = JST_6;
  JST_7 = JST_7;
  JST_8 = JST_8;
  JST_9 = JST_9;
  JST_STAR = JST_STAR;
  JST_POUND = JST_POUND;
  JST_START = JST_START;
  JST_PAUSE = JST_PAUSE;
  JST_RESET = JST_RESET;

  createControllers() {
    this.keyToControlMapping = new AtariKeyCodeToControlMapping();
    return new Controllers([
      new Controller(this.keyToControlMapping),
      new Controller(),
    ]);
  }

  createAudioProcessor() {
    return new ScriptAudioProcessor(
      1,
      48000,
      8192 + 4096,
      2048,
    ).setDebug(this.debug);
  }

  createVisibilityMonitor() {
    const { app } = this;

    return new VisibilityChangeMonitor((p) => {
      if (!app.isPauseScreen() && !app.isControllersScreen()) {
        this.pause(p);
      }
    });
  }

  getScriptUrl() {
    return 'js/a5200_libretro.js';
  }

  async onShowPauseMenu() {
    // await this.saveState();
  }

  showControllers(index, swap) {
    const { app, controllers } = this;

    if (controllers) {
      controllers.setEnabled(false);

      // Total hack to allow spacebar to repeat keypress
      // TODO: Fix this in the future
      controllers.addFakeKeyEvent(KCODES.SPACE_BAR, false);
      controllers.addFakeKeyEvent(KCODES.ENTER, false);
    }

    setTimeout(() => {
      this.showPauseDelay = 0;
      app.showControllers(index, false /*swap*/, () => {
        if (controllers) {
          controllers.setEnabled(true);
        }
        this.pause(false, true);
      })
    }, this.showPauseDelay);
  }

  onKeypad(index, key, keyPressed = null) {
    const { controllers } = this;

    // Total hack to allow spacebar to repeat keypress
    // TODO: Fix this in the future
    if (keyPressed) {
      controllers.addFakeKeyEvent(keyPressed, true);
    }

    this.keypad[index] = key;
    this.keypadDown[index] = true;
    this.keypadCount[index] = 10;
  }

  pollControls() {
    const { controllers, keyToControlMapping, mappings } = this;

    controllers.poll();

    let swap = false
    if (this.getProps().swap) {
      swap = true;
    }

    let analog = false;
    if (this.getProps().analog) {
      analog = true;
    }
    const analogToDigital = !analog;

    let twinStick = false;
    if (this.getProps().twinStick) {
      twinStick = true;
    }

    for (let i = 0; i < 2; i++) {

      let input = 0;
      let keyboardPressed = false;

      if (i === 0 && (
        keyToControlMapping.isControlDown(SPACE_BAR) ||
        controllers.isControlDown(i, CIDS.START))) {
        keyboardPressed = true;
      }

      let keypadInput = false;
      if (this.keypad[i]) {
        const val = this.keypad[i];

        this.keypadCount[i]--;

        if (this.keypadDown[i]) {
          this.keypadDown[i] = (controllers.isControlDown(i, CIDS.A) || keyboardPressed);
        }

        if (this.keypadCount[i] <= 0 && !this.keypadDown[i]) {
          this.keypad[i] = 0;
          this.keypadCount[i] = 0;
          this.keypadDown[i] = false;
        }

        if (val) {
          keypadInput = true;
          input = val;
        }
      }

      if (!keypadInput) {
        if (i === 0) {
          if (controllers.isControlDown(i, CIDS.ESCAPE)) {
            if (this.pause(true)) {
              controllers
                .waitUntilControlReleased(i, CIDS.ESCAPE)
                .then(() => this.showPauseMenu());
              return;
            }
          }

          if (controllers.isControlDown(i, CIDS.START)) {
            if (this.pause(true)) {
              controllers
                .waitUntilControlReleased(i, CIDS.START)
                .then(() => this.showControllers(i, swap));
              return;
            }
          }

          if (controllers.isControlDown(i, CIDS.UP, analogToDigital)) {
            input |= JST_UP;
          } else if (controllers.isControlDown(i, CIDS.DOWN, analogToDigital)) {
            input |= JST_DOWN;
          }

          if (controllers.isControlDown(i, CIDS.RIGHT, analogToDigital)) {
            input |= JST_RIGHT;
          } else if (controllers.isControlDown(i, CIDS.LEFT, analogToDigital)) {
            input |= JST_LEFT;
          }

          if (controllers.isControlDown(i, CIDS.SELECT)) {
            input |= JST_START;
          }

          let kv = false;
          for (let b = 0; b < BUTTONS.length; b++) {
            const button = BUTTONS[b];
            if (controllers.isControlDown(i, button.cid)) {
              const mapping = mappings[button.button];
              if (mapping) {
                const v = INPUTS[mapping]
                if (v & 0x000F) {
                  if (kv) {
                    continue;
                  } else {
                    kv = true;
                  }
                }
                input |= INPUTS[mapping];
              }
            }
          }

          if (i === 0 && !(input & 0x000F)) {
            if (keyToControlMapping.isControlDown(DIGIT_0)) {
              input |= JST_0;
            } else if (keyToControlMapping.isControlDown(DIGIT_1)) {
              input |= JST_1;
            } else if (keyToControlMapping.isControlDown(DIGIT_2)) {
              input |= JST_2;
            } else if (keyToControlMapping.isControlDown(DIGIT_3)) {
              input |= JST_3;
            } else if (keyToControlMapping.isControlDown(DIGIT_4)) {
              input |= JST_4;
            } else if (keyToControlMapping.isControlDown(DIGIT_5)) {
              input |= JST_5;
            } else if (keyToControlMapping.isControlDown(DIGIT_6)) {
              input |= JST_6;
            } else if (keyToControlMapping.isControlDown(DIGIT_7)) {
              input |= JST_7;
            } else if (keyToControlMapping.isControlDown(DIGIT_8)) {
              input |= JST_8;
            } else if (keyToControlMapping.isControlDown(DIGIT_9)) {
              input |= JST_9;
            } else if (keyToControlMapping.isControlDown(MINUS)) {
              input |= JST_STAR;
            } else if (keyToControlMapping.isControlDown(EQUAL)) {
              input |= JST_POUND;
            }
          }
        }
      }

      if (twinStick && i === 1) {
        if (controllers.isAxisLeft(0, 1)) {
          input |= JST_LEFT;
        }
        if (controllers.isAxisRight(0, 1)) {
          input |= JST_RIGHT;
        }
        if (controllers.isAxisUp(0, 1)) {
          input |= JST_UP;
        }
        if (controllers.isAxisDown(0, 1)) {
          input |= JST_DOWN;
        }
      }

      let index = i;
      if (swap) {
        if (i === 0) {
          index = 1;
        } else if (i === 1) {
          index = 0;
        }
      }

      this.inputs[index] = input;

      if (analog) {
        if (i === 0) {
          const twin = twinStick && i === 1;
          let daIndex = twin ? 0 : i;
          let daOffset = twin ? 1 : 0;
          this.analog[index] = [
            controllers.getAxisValue(daIndex, daOffset, true),
            controllers.getAxisValue(daIndex, daOffset, false),
            controllers.getAxisValue(i, 1, true),
            controllers.getAxisValue(i, 1, false)
          ];
        }
      } else {
        this.analog[index] = [0, 0, 0, 0];
      }
    }

    if (swap) {
      const kp0 = this.inputs[0] & 0x000F;
      const kp1 = this.inputs[1] & 0x000F;
      this.inputs[0] = (this.inputs[0] & 0xFFF0) | kp1;
      this.inputs[1] = (this.inputs[1] & 0xFFF0) | kp0;
    }
  }

  getInput(index) {
    const val = this.inputs[index];
    return val;
  }

  getAnalog(index, stick, isX) {
    // const sens = 0;
    // const adjust = 1;
    // if (sens !== 0) {
    //   // range = .5
    //   // increment = .5 / 10
    //   // sens * increment
    // }
    return this.analog[index][stick * 2 + (isX ? 0 : 1)];
  }

  async loadState() {
    // Check cloud storage (eliminate delay when showing settings)
    try {
      await this.getSaveManager().isCloudEnabled(this.loadMessageCallback);
    } finally {
      this.loadMessageCallback(null);
    }
  }

  saveState() {}
  applyGameSettings() {}

  onFrame() {
    if (this.audioStarted !== -1) {
      if (this.audioStarted > 1) {
        this.audioStarted = -1;
        // Start the audio processor
        this.audioProcessor.start();
      } else {
        this.audioStarted++;
      }
    }
  }

  async onWriteAdditionalFiles() {
    await super.onWriteAdditionalFiles();
    const { FS } = window;
    const props = this.getProps();
    const atariRom = props.atari5200_rom;
    if (atariRom) {
      try {
        // Atari ROM
        const uz = new Unzip().setDebug(true);
        const res = await new FetchAppData(atariRom).fetch();
        let blob = await res.blob();
        // Unzip it
        blob = await uz.unzip(blob, ['.bin', '.rom']);
        // Convert to array buffer
        const arrayBuffer = await new Response(blob).arrayBuffer();
        // Write to file system
        const u8array = new Uint8Array(arrayBuffer);
        FS.writeFile('/bios.bin', u8array);
      } catch (e) {
        LOG.error(e);
      }
    }
  }

  getDefaultAspectRatio() {
    return 1.333;
  }

  resizeScreen(canvas) {
    this.canvas = canvas;
    this.updateScreenSize();
  }

  getShotAspectRatio() { return this.getDefaultAspectRatio(); }
}