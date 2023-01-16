import React from "react";

import {
  WebrcadeRetroApp
} from '@webrcade/app-common';

import { Emulator } from './emulator';
import { EmulatorPauseScreen } from './pause';
import { ControllersScreen } from './controllers';

import './App.scss';

class App extends WebrcadeRetroApp {

  CONTROLLERS_MODE = "controllers";

  createEmulator(app, isDebug) {
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
    const { controllerIndex } = this.state;
    const { CONTROLLERS_MODE, emulator, descriptions } = this;

    return (
      <ControllersScreen
        controllerIndex={controllerIndex}
        onSelect={(key, keyCode) => {emulator.onKeypad(controllerIndex, key, keyCode)}}
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

  showControllers(index, resumeCallback) {
    const { mode } = this.state;
    const { CONTROLLERS_MODE } = this;

    if (mode !== CONTROLLERS_MODE) {
      this.setState({
        mode: CONTROLLERS_MODE,
        resumeCallback: resumeCallback,
        controllerIndex: index
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
    const { mode } = this.state;
    const { CONTROLLERS_MODE } = this;

    return (
      <>
        {super.render()}
        {mode === CONTROLLERS_MODE ? this.renderControllersScreen() : null}
      </>
    );
  }
}

export default App;
