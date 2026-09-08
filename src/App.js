import React from "react";

import {
  RadialKeypad,
  WebrcadeRetroApp
} from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';
import { ControllersScreen } from './controllers';
import { TouchOverlay } from './touchoverlay';

import './App.scss';

// Clockwise from the top -- the grid keypad screen's own 3-column layout
// ([1,2,3],[4,5,6],[7,8,9],[*,0,#], below the Start/Pause/Reset row)
// flattened row-major onto the ring, so each row starts exactly on a
// clock cardinal: 1 at 12 o'clock, 4 at 3 o'clock, 7 at 6 o'clock, * at 9
// o'clock. Matches spatial memory of the real controller's grid better
// than a plain 1-9,0,*,# count. Same convention Coleco/Jaguar use.
const RADIAL_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"];

// Maps a key label to the numeric input value the emulator expects
// (emulator.JST_1, etc. -- see emulator/index.js), the same values the
// grid keypad screen (controllers/index.js) sends via onSelect/onKeypad.
// Passed to the shared RadialKeypad component as its keyToValue prop.
const RADIAL_KEY_TO_VALUE = {
  "1": "JST_1", "2": "JST_2", "3": "JST_3", "4": "JST_4",
  "5": "JST_5", "6": "JST_6", "7": "JST_7", "8": "JST_8",
  "9": "JST_9", "0": "JST_0", "*": "JST_STAR", "#": "JST_POUND",
};

class App extends WebrcadeRetroApp {

  CONTROLLERS_MODE = "controllers";

  radialKeypadRef = React.createRef();

  constructor() {
    super();
    this.state = {
      ...this.state,
      showCanvas: false,
    };
  }

  // Called once by Emulator.onFrame() -- gates the upper-right touch
  // overlay (keypad/pause icons) so it doesn't render before the emulator
  // itself exists, same as Coleco/Jaguar.
  showCanvas() {
    this.setState({ showCanvas: true });
  }

  // Called once per frame per controller from Emulator.pollControls() --
  // forwarded straight through as an imperative call (not setState) so
  // the update happens synchronously in the same frame, with no extra
  // polling or animation loop of its own.
  updateRadialStick(controller, x, y, confirmDown) {
    const { current } = this.radialKeypadRef;
    if (current) current.updateStick(controller, x, y, confirmDown);
  }

  // Called from Emulator.onPause() the instant pause starts (covers both
  // the real pause menu and the grid keypad screen -- both trigger via
  // the same pause(true) call). Needed because pausing only stops
  // updateRadialStick() from being called again going forward; it does
  // nothing about a ring that's already open at that exact moment, which
  // would otherwise stay frozen visible behind the screen that just
  // opened.
  hideRadialKeypad() {
    const { current } = this.radialKeypadRef;
    if (current) current.hide();
  }

  createEmulator(app, isDebug) {
    const { appProps } = this;

    let descriptions = appProps.descriptions;
    if (!descriptions) {
      descriptions = {}
    }
    this.descriptions = descriptions;

    let mappings = appProps.mappings;
    if (!mappings) {
      mappings = {}
    }
    this.mappings = mappings;
    console.log(this.mappings)

    return new Emulator(app, isDebug);
  }

  isDiscBased() {
    return false;
  }

  isBiosRequired() {
    return false;
  }

  renderCanvas() {
    return (
      <canvas
        style={this.getCanvasStyles()}
        ref={(canvas) => {
          this.canvas = canvas;
        }}
        id="canvas"
      ></canvas>
    );
  }

  renderControllersScreen() {
    const { controllerIndex, controllerSwap } = this.state;
    const { CONTROLLERS_MODE, emulator, descriptions } = this;

    return (
      <ControllersScreen
        controllerIndex={controllerIndex}
        controllerSwap={controllerSwap}
        initialRow={this.lastKeyRow}
        initialCol={this.lastKeyCol}
        onSelect={(key, r, c, keyCode) => {
          this.lastKeyRow = r;
          this.lastKeyCol = c;
          emulator.onKeypad(controllerIndex, key, keyCode);
        }}
        closeCallback={() => { this.resume(CONTROLLERS_MODE) }}
        descriptions={descriptions}
        emulator={emulator}
      />
    );
  }

  renderPauseScreen() {
    const { appProps, emulator } = this;

    return (
      <EmulatorPauseScreen
        emulator={emulator}
        appProps={appProps}
        closeCallback={() => this.resume()}
        exitCallback={() => {
          this.exitFromPause();
        }}
        isEditor={this.isEditor}
        isStandalone={this.isStandalone}
      />
    );
  }

  showControllers(index, swap, resumeCallback) {
    const { mode } = this.state;
    const { CONTROLLERS_MODE } = this;

    if (mode !== CONTROLLERS_MODE) {
      this.setState({
        mode: CONTROLLERS_MODE,
        resumeCallback: resumeCallback,
        controllerIndex: index,
        controllerSwap: swap
      })
      return true;
    }
    return false;
  }

  isControllersScreen() {
    const { mode } = this.state;
    const { CONTROLLERS_MODE } = this;
    return mode === CONTROLLERS_MODE;
  }

  render() {
    const { mode, showCanvas } = this.state;
    const { CONTROLLERS_MODE, emulator, descriptions } = this;

    return (
      <>
        {super.render()}
        {mode === CONTROLLERS_MODE ? this.renderControllersScreen() : null}
        <TouchOverlay show={showCanvas} />
        <RadialKeypad
          ref={this.radialKeypadRef}
          emulator={emulator}
          descriptions={descriptions}
          keys={RADIAL_KEYS}
          keyToValue={RADIAL_KEY_TO_VALUE}
        />
      </>
    );
  }
}

export default App;
