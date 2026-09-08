import {
  Controller,
  Controllers,
  KeyCodeToControlMapping,
  RetroAppWrapper,
  SCREEN_CONTROLS,
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
// Opens the grid keypad screen directly -- keyboard equivalent of
// LTRIG+RANALOG (see pollControls()), added alongside the existing
// Enter/Start trigger (kept for backward compatibility) rather than
// replacing it, matching the LTRIG+RANALOG/Control combo Jaguar and
// Coleco use for cross-app consistency.
const CONTROL_KEY = KEY_FLAG | 14;

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
      [KCODES.CONTROL_LEFT]: CONTROL_KEY,
      [KCODES.CONTROL_RIGHT]: CONTROL_KEY,
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

    // Guards the LTRIG+RANALOG grid-keypad trigger below from re-firing
    // every frame while the combo stays held -- same pending-flag pattern
    // Jaguar/Coleco use for their own virtual-keyboard/keypad triggers.
    this.gamepadVkPending = false;
    // Edge-detects CONTROL_KEY (rising edge starts the wait-for-release
    // below, matching every other trigger's pattern).
    this.controlKeyDown = false;
    // Latched true if Shift joins Control before release -- see the
    // CONTROL_KEY block in pollControls(). Read once at release to decide
    // whether to open the grid keypad or redirect to the pause menu.
    this.controlKeyEscalated = false;

    // Drives the upper-right touch overlay (keypad/pause icons) -- same
    // mechanism as Coleco/Jaguar's TouchOverlay: latch the first time each
    // interaction type is observed, and react via checkOnScreenControls().
    // See onFrame() for where the listeners actually get attached.
    this.firstFrame = true;
    this.touchEvent = false;
    this.mouseEvent = false;
    this.keyboardEvent = false;

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

  // Force-closes the radial keypad the instant pause starts -- see
  // App.js's hideRadialKeypad() for why this can't just rely on pause()
  // stopping pollControls() from being called again.
  onPause(p) {
    super.onPause(p);
    if (p && this.app && this.app.hideRadialKeypad) {
      this.app.hideRadialKeypad();
    }
  }

  // Base class default pauses on any tap anywhere on screen -- redundant
  // (and disruptive) now that there's a dedicated Pause button in the
  // touch overlay. Same override Coleco/Jaguar use for the same reason.
  createTouchListener() {}

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

      // Stick-driven radial keypad selector, mirroring Coleco/Jaguar for
      // cross-app consistency. Not supported while twinStick is active --
      // that mode already claims controller 0's right stick as a virtual
      // second joystick, so there's no free stick left for keypad
      // selection. Also suppressed while LTRIG is held, same as elsewhere,
      // so reaching for the LTRIG+RANALOG grid-keypad combo below doesn't
      // also pop the ring open.
      if (this.app && this.app.updateRadialStick && !twinStick &&
          !controllers.isControlDown(i, CIDS.LTRIG)) {
        const analog1x = controllers.getAxisValue(i, 1, true);
        const analog1y = controllers.getAxisValue(i, 1, false);
        const confirmDown = controllers.isControlDown(i, CIDS.LBUMP) ||
          controllers.isControlDown(i, CIDS.RBUMP);
        this.app.updateRadialStick(i, analog1x, analog1y, confirmDown);
      }

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
          // LTRIG+RANALOG opens the grid keypad screen -- same gesture
          // Jaguar/Coleco use for their own on-screen keypad, added here
          // for cross-app consistency alongside the existing Start trigger
          // (kept as-is, not replaced). Must be checked before CIDS.ESCAPE
          // below, since this same combo also synthesizes CIDS.ESCAPE (see
          // Controller.isControlDown's ESCAPE branch in
          // @webrcade/app-common) -- intercepting it here first stops it
          // from falling through to the default pause-menu-open behavior.
          // Toggle-close is handled by ControllersScreen's own
          // globalGamepadCallback (already closes on any ESC-type gamepad
          // event, which this combo also produces), not here. Kept inside
          // this existing i===0 block -- A5200's meta triggers (Escape/
          // Start-opens-keypad below) have always been player-1-only here,
          // unlike Coleco's; not changing that scope as a side effect of
          // this pass.
          if (controllers.isControlDown(i, CIDS.LTRIG) && controllers.isControlDown(i, CIDS.RANALOG)) {
            if (!this.gamepadVkPending) {
              this.gamepadVkPending = true;
              controllers
                .waitUntilControlReleased(i, CIDS.ESCAPE)
                .then(() => {
                  this.gamepadVkPending = false;
                  if (this.pause(true)) {
                    this.showControllers(i, swap);
                  }
                });
            }
            continue;
          }

          // Control key opens the grid keypad screen -- keyboard
          // equivalent of LTRIG+RANALOG above, added alongside the
          // existing Enter trigger (kept as-is). Waits for release before
          // showing anything, matching every other trigger here (Enter/
          // CIDS.START below, LTRIG+RANALOG above, CIDS.ESCAPE below)
          // instead of acting immediately on keydown -- see Coleco/
          // Jaguar's emulator/index.js for the full rationale (acting
          // immediately exposed the freshly-opened screen to the very
          // keystroke that opened it, and gave no clean way to redirect to
          // the real pause menu if Shift joins mid-press). Toggle-close
          // (pressing Control again once the keypad is already open) is
          // handled by ControllersScreen's own handleKeyDownEvent,
          // unrelated to this. Uses its own release-wait loop rather than
          // controllers.waitUntilControlReleased() (used elsewhere here)
          // because it also needs to keep sampling CIDS.ESCAPE (i.e. Shift
          // joining Control) on every tick, not just check one condition
          // at the end -- self-driven via setTimeout regardless, since
          // pollControls() itself stops being called the moment pause(true)
          // succeeds.
          const controlDown = keyToControlMapping.isControlDown(CONTROL_KEY);
          if (controlDown && !this.controlKeyDown && this.pause(true)) {
            this.controlKeyEscalated = false;
            const CONTROL_KEY_WAIT_INTERVAL = 50;
            const waitForControlKeyRelease = () => {
              if (keyToControlMapping.isControlDown(CIDS.ESCAPE)) {
                this.controlKeyEscalated = true;
              }
              if (keyToControlMapping.isControlDown(CONTROL_KEY)) {
                setTimeout(waitForControlKeyRelease, CONTROL_KEY_WAIT_INTERVAL);
              } else if (this.controlKeyEscalated) {
                this.showPauseMenu();
              } else {
                this.showControllers(0, swap);
              }
            };
            setTimeout(waitForControlKeyRelease, CONTROL_KEY_WAIT_INTERVAL);
          }
          this.controlKeyDown = controlDown;

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

    // Attaches the touch/mouse/keyboard interaction listeners once, on the
    // real first frame (same timing Coleco/Jaguar use), and flips on the
    // touch overlay's gating state (App.js's showCanvas()) so it can't
    // render before the emulator actually exists.
    if (!this.firstFrame) return;
    this.firstFrame = false;

    this.app.showCanvas();

    setTimeout(() => {
      const onTouch = () => { this.onTouchEvent() };
      window.addEventListener("touchstart", onTouch);
      window.addEventListener("touchend", onTouch);
      window.addEventListener("touchcancel", onTouch);
      window.addEventListener("touchmove", onTouch);

      const onMouse = () => { this.onMouseEvent() };
      window.addEventListener("mousedown", onMouse);
      window.addEventListener("mouseup", onMouse);
      window.addEventListener("mousemove", onMouse);

      document.onkeydown = (e) => {
        if (this.paused) return;
        this.onKeyboardEvent(e);
      };
    }, 0);
  }

  onTouchEvent() {
    if (!this.touchEvent) {
      this.touchEvent = true;
      this.checkOnScreenControls();
    }
  }

  onMouseEvent() {
    if (!this.mouseEvent) {
      this.mouseEvent = true;
      this.checkOnScreenControls();
    }
  }

  onKeyboardEvent(e) {
    if (e.code && !this.keyboardEvent) {
      this.keyboardEvent = true;
      this.checkOnScreenControls();
    }
  }

  showTouchOverlay(show) {
    const to = document.getElementById("touch-overlay");
    if (to) {
      to.style.display = show ? 'block' : 'none';
    }
  }

  // Reacts immediately to a just-detected interaction (see
  // onTouchEvent()/onMouseEvent()/onKeyboardEvent() above) -- only SC_AUTO
  // needs to do anything here, since SC_ON/SC_OFF are already handled
  // unconditionally by updateOnScreenControls() at startup and whenever
  // the Settings preference itself changes.
  checkOnScreenControls() {
    const controls = this.prefs.getScreenControls();
    if (controls === SCREEN_CONTROLS.SC_AUTO) {
      setTimeout(() => {
        this.showTouchOverlay(true);
        this.app.forceRefresh();
      }, 0);
    }
  }

  // Broader lifecycle hook (base class calls this once at real startup
  // with initial=true, and the Settings screen calls it again whenever
  // "Screen Controls" changes) -- unlike checkOnScreenControls(), this has
  // to explicitly handle all three preference values, and skips SC_AUTO
  // entirely on the initial call so the overlay doesn't flash before any
  // real interaction has happened yet.
  updateOnScreenControls(initial = false) {
    const controls = this.prefs.getScreenControls();
    if (controls === SCREEN_CONTROLS.SC_OFF) {
      this.showTouchOverlay(false);
    } else if (controls === SCREEN_CONTROLS.SC_ON) {
      this.showTouchOverlay(true);
    } else if (controls === SCREEN_CONTROLS.SC_AUTO) {
      if (!initial) {
        setTimeout(() => {
          this.showTouchOverlay(this.touchEvent || this.mouseEvent);
          this.app.forceRefresh();
        }, 0);
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