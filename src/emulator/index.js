import {
  Controller,
  Controllers,
  DisplayLoop,
  KeyCodeToControlMapping,
  RetroAppWrapper,
  ScriptAudioProcessor,
  VisibilityChangeMonitor,
  CIDS,
  LOG,
  KCODES,
} from '@webrcade/app-common';

const STATE_FILE_PATH = "/home/web_user/retroarch/userdata/states/game.state";

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

    this.width = 320;
    this.height = 224;

    this.keypad = [0, 0];
    this.keypadCount = [0, 0];
    this.keypadDown = [false, false];

    this.inputs = [0, 0];
    this.analog = [[0, 0, 0, 0], [0, 0, 0, 0]];

    // Set defaults if applicable
app.mappings = {};
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
    return new ScriptAudioProcessor(1, 48000).setDebug(this.debug);
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

  showControllers(index) {
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
      app.showControllers(index, () => {
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
              .then(() => this.showControllers(i));
            return;
          }
        }

        const analogToDigital = false; // controlsMode !== CONTROLS_DRIVING;
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

      this.inputs[i] = input;
      this.analog[i] = [
        controllers.getAxisValue(i, 0, true),
        controllers.getAxisValue(i, 0, false),
        controllers.getAxisValue(i, 1, true),
        controllers.getAxisValue(i, 1, false)
      ];
    }
  }

  getInput(index) {
    const val = this.inputs[index];
    return val;
  }

  getAnalog(index, stick, isX) {
    return this.analog[index][stick * 2 + (isX ? 0 : 1)];
  }

  async getStateSlots(showStatus = true) {
    return await this.getSaveManager().getStateSlots(
      this.saveStatePrefix, showStatus ? this.saveMessageCallback : null
    );
  }

  async saveStateForSlot(slot) {
    const { FS, Module } = window;

    var save = Module.cwrap('wrc_save_state', null, ['string']);
    save(STATE_FILE_PATH);

    let s = null;
    try {

      try {
        s = FS.readFile(STATE_FILE_PATH);
      } catch (e) {}

      if (s) {
        await this.getSaveManager().saveState(
          this.saveStatePrefix, slot, s,
          this.canvas,
          this.saveMessageCallback, null, {aspectRatio: "1.333"});
      }
    } catch (e) {
      LOG.error('Error saving state: ' + e);
    }

    return true;
  }

  async loadStateForSlot(slot) {
    const { FS, Module } = window;

    try {
      const state = await this.getSaveManager().loadState(
        this.saveStatePrefix, slot, this.saveMessageCallback);

      if (state) {
        FS.writeFile(STATE_FILE_PATH, state);
        var load = Module.cwrap('wrc_load_state', null, ['string']);
        load(STATE_FILE_PATH);
      }
    } catch (e) {
      LOG.error('Error loading state: ' + e);
    }
    return true;
  }

  async deleteStateForSlot(slot, showStatus = true) {
    try {
      await this.getSaveManager().deleteState(
        this.saveStatePrefix, slot, showStatus ? this.saveMessageCallback : null);
    } catch (e) {
      LOG.error('Error deleting state: ' + e);
    }
    return true;
  }

  loadState() {}
  saveState() {}
  applyGameSettings() {}

  getCustomStartHandler() {
    return async (emulator) => {
      try {
        const { Module } = window;
        console.log(Module);
        console.log(emulator.uid);

        // Check cloud storage (eliminate delay when showing settings)
        try {
          await emulator.getSaveManager().isCloudEnabled(emulator.loadMessageCallback);
        } finally {
          emulator.loadMessageCallback(null);
        }

        emulator.initVideo(emulator.canvas);

        // Create display loop
        emulator.displayLoop = new DisplayLoop(/*isPal ? 50 :*/ 60, true, emulator.debug);

        // Start the emulator
        var fstart =  Module.cwrap('wrc_start', null, ['string']);
        fstart(emulator.game);

        // frame step method
        const frame = Module._wrc_step;

        let audioArray = null;
        emulator.audioCallback = (offset, length) => {
          audioArray = new Uint8Array(Module.HEAP8.buffer, offset, 4096);
          emulator.audioProcessor.storeSoundCombinedInput(
            audioArray, 1, length, 0, 255,
          );
        };

        // Enable showing messages
        emulator.setShowMessageEnabled(true);

        let audioStarted = 0;

        // Start the display loop
        let error = false;
        emulator.displayLoop.start(() => {
          emulator.pollControls();

          if (!error) {
            try {
              frame();
            } catch (e) {
              error = true;
              LOG.error(e);
            }

            if (audioStarted !== -1) {
              if (audioStarted > 1) {
                audioStarted = -1;
                // Start the audio processor
                emulator.audioProcessor.start();
              } else {
                audioStarted++;
              }
            }
          }
        });
      } catch (e) {
        emulator.app.exit(e)
      }
    }
  }

  resizeScreen(canvas) {
    // Determine the zoom level
    let zoomLevel = 0;
    if (this.getProps().zoomLevel) {
      zoomLevel = this.getProps().zoomLevel;
    }

    const size = 96 + zoomLevel;
    canvas.style.setProperty('width', `${size}vw`, 'important');
    canvas.style.setProperty('height', `${size}vh`, 'important');
    canvas.style.setProperty('max-width', `calc(${size}vh*1.333)`, 'important');
    canvas.style.setProperty('max-height', `calc(${size}vw*0.75)`, 'important');
  }

  getShotAspectRatio() { return 1.333; }

  clearImageData(image, imageData, pixelCount) {
    for (var i = 0; i < pixelCount * 4;) {
      imageData[i++] = 0;
      imageData[i++] = 0;
      imageData[i++] = 0;
      imageData[i++] = 0xff;
    }
    this.context.putImageData(image, 0, 0);
  }

  setVisibleSize(width, height) {
    const { canvas } = this;
    LOG.info('### visible size: ' + width + 'x' + height);
    canvas.width = width;
    canvas.height = height;
    this.pixelCount = width * height;
  }

  initVideo(canvas) {
    let { width, height } = this;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');
    this.image = this.context.getImageData(0, 0, width, height);
    this.imageData = this.image.data;
    this.clearImageData(this.image, this.imageData, width * height);
    this.setVisibleSize(width, height);
  }

  PALETTE = [
    0x000000, 0x252525, 0x343434, 0x4F4F4F,
    0x5B5B5B, 0x696969, 0x7B7B7B, 0x8A8A8A,
    0xA7A7A7, 0xB9B9B9, 0xC5C5C5, 0xD0D0D0,
    0xD7D7D7, 0xE1E1E1, 0xF4F4F4, 0xFFFFFF,
    0x4C3200, 0x623A00, 0x7B4A00, 0x9A6000,
    0xB57400, 0xCC8500, 0xE79E08, 0xF7AF10,
    0xFFC318, 0xFFD020, 0xFFD828, 0xFFDF30,
    0xFFE63B, 0xFFF440, 0xFFFA4B, 0xFFFF50,
    0x992500, 0xAA2500, 0xB42500, 0xD33000,
    0xDD4802, 0xE25009, 0xF46700, 0xF47510,
    0xFF9E10, 0xFFAC20, 0xFFBA3A, 0xFFBF50,
    0xFFC66D, 0xFFD580, 0xFFE490, 0xFFE699,
    0x980C0C, 0x990C0C, 0xC21300, 0xD31300,
    0xE23500, 0xE34000, 0xE44020, 0xE55230,
    0xFD7854, 0xFF8A6A, 0xFF987C, 0xFFA48B,
    0xFFB39E, 0xFFC2B2, 0xFFD0BA, 0xFFD7C0,
    0x990000, 0xA90000, 0xC20400, 0xD30400,
    0xDA0400, 0xDB0800, 0xE42020, 0xF64040,
    0xFB7070, 0xFB7E7E, 0xFB8F8F, 0xFF9F9F,
    0xFFABAB, 0xFFB9B9, 0xFFC9C9, 0xFFCFCF,
    0x7E0050, 0x800050, 0x80005F, 0x950B74,
    0xAA2288, 0xBB2F9A, 0xCE3FAD, 0xD75AB6,
    0xE467C3, 0xEF72CE, 0xFB7EDA, 0xFF8DE1,
    0xFF9DE5, 0xFFA5E7, 0xFFAFEA, 0xFFB8EC,
    0x48006C, 0x5C0488, 0x650D90, 0x7B23A7,
    0x933BBF, 0x9D45C9, 0xA74FD3, 0xB25ADE,
    0xBD65E9, 0xC56DF1, 0xCE76FA, 0xD583FF,
    0xDA90FF, 0xDE9CFF, 0xE2A9FF, 0xE6B6FF,
    0x1B0070, 0x221B8D, 0x3730A2, 0x4841B3,
    0x5952C4, 0x635CCE, 0x6F68DA, 0x7D76E8,
    0x8780F8, 0x938CFF, 0x9D97FF, 0xA8A3FF,
    0xB3AFFF, 0xBCB8FF, 0xC4C1FF, 0xDAD1FF,
    0x000D7F, 0x0012A7, 0x0018C0, 0x0A2BD1,
    0x1B4AE3, 0x2F58F0, 0x3768FF, 0x4979FF,
    0x5B85FF, 0x6D96FF, 0x7FA3FF, 0x8CADFF,
    0x96B4FF, 0xA8C0FF, 0xB7CBFF, 0xC6D6FF,
    0x00295A, 0x003876, 0x004892, 0x005CAC,
    0x0071C6, 0x0086D0, 0x0A9BDF, 0x1AA8EC,
    0x2BB6FF, 0x3FC2FF, 0x45CBFF, 0x59D3FF,
    0x7FDAFF, 0x8FDEFF, 0xA0E2FF, 0xB0EBFF,
    0x004A00, 0x004C00, 0x006A20, 0x508E79,
    0x409999, 0x009CAA, 0x00A1BB, 0x01A4CC,
    0x03A5D7, 0x05DAE2, 0x18E5FF, 0x34EAFF,
    0x49EFFF, 0x66F2FF, 0x84F4FF, 0x9EF9FF,
    0x004A00, 0x005D00, 0x007000, 0x008300,
    0x009500, 0x00AB00, 0x07BD07, 0x0AD00A,
    0x1AD540, 0x5AF177, 0x82EFA7, 0x84EDD1,
    0x89FFED, 0x7DFFFF, 0x93FFFF, 0x9BFFFF,
    0x224A03, 0x275304, 0x306405, 0x3C770C,
    0x458C11, 0x5AA513, 0x1BD209, 0x1FDD00,
    0x3DCD2D, 0x3DCD30, 0x58CC40, 0x60D350,
    0xA2EC55, 0xB3F24A, 0xBBF65D, 0xC4F870,
    0x2E3F0C, 0x364A0F, 0x405615, 0x465F17,
    0x57771A, 0x65851C, 0x74931D, 0x8FA525,
    0xADB72C, 0xBCC730, 0xC9D533, 0xD4E03B,
    0xE0EC42, 0xEAF645, 0xF0FD47, 0xF4FF6F,
    0x552400, 0x5A2C00, 0x6C3B00, 0x794B00,
    0xB97500, 0xBB8500, 0xC1A120, 0xD0B02F,
    0xDEBE3F, 0xE6C645, 0xEDCD57, 0xF5DB62,
    0xFBE569, 0xFCEE6F, 0xFDF377, 0xFDF37F,
    0x5C2700, 0x5C2F00, 0x713B00, 0x7B4800,
    0xB96820, 0xBB7220, 0xC58629, 0xD79633,
    0xE6A440, 0xF4B14B, 0xFDC158, 0xFFCC55,
    0xFFD461, 0xFFDD69, 0xFFE679, 0xFFEA98
  ];

  drawScreen(buff, width, height) {
    // TODO: Check width and height changes?
    const { image, imageData } = this;
    const { Module } = window;

    const b = new Uint8Array(Module.HEAP8.buffer, buff, 512 * 512);
    let y = 0;
    let index = 0;
    for (y = 8; y < (height - 8); y++) {
      for (let x = 0; x < width; x++) {
        const v = b[(y * 512) + 32 + x];
        const c = this.PALETTE[v];
        imageData[index++] = (c >> 16) & 0xff;
        imageData[index++] = (c >> 8) & 0xff;
        imageData[index++] = c & 0xff;
        index++;
      }
    }
    this.context.putImageData(image, 0, 0);
  }
}
