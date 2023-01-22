import React from 'react';

import { ControlsTab } from '@webrcade/app-common';

const getDefaultName = (emulator, value) => {
  if (value === "1") {
    return "Keypad 1";
  } else if (value === "2") {
    return "Keypad 2";
  } else if (value === "3") {
    return "Keypad 3";
  } else if (value === "4") {
    return "Keypad 4";
  } else if (value === "5") {
    return "Keypad 5";
  } else if (value === "6") {
    return "Keypad 6";
  } else if (value === "7") {
    return "Keypad 7";
  } else if (value === "8") {
    return "Keypad 8";
  } else if (value === "9") {
    return "Keypad 9";
  } else if (value === "0") {
    return "Keypad 0";
  } else if (value === "*") {
    return "Keypad *";
  } else if (value === "#") {
    return "Keypad #";
  } else if (value === "topfire") {
    return "Top Fire";
  } else if (value === "bottomfire") {
    return "Bottom Fire";
  } else if (value === "start") {
    return "Start";
  } else if (value === "reset") {
    return "Reset";
  } else if (value === "pause") {
    return "Pause";
  }
}

const getName = (emulator, button, mappings, descriptions) => {
  const value = mappings[button];
  if (!value) return null;

  const description = descriptions[value];
  return description ? description : getDefaultName(emulator, value);
}

const getNameForValue = (emulator, value, descriptions) => {
  const description = descriptions[value];
  return description ? description : getDefaultName(emulator, value);
}

export class GamepadControlsTab extends ControlsTab {
  render() {
    const { emulator } = this.props;
    const mappings = emulator.mappings;
    let descriptions = emulator.getApp().descriptions;
    if (!descriptions) descriptions = {}

    const aName = getName(emulator, "a", mappings, descriptions);
    const bName = getName(emulator, "b", mappings, descriptions);
    const xName = getName(emulator, "x", mappings, descriptions);
    const yName = getName(emulator, "y", mappings, descriptions);
    const lbName = getName(emulator, "lb", mappings, descriptions);
    const rbName = getName(emulator, "rb", mappings, descriptions);
    const ltName = getName(emulator, "lt", mappings, descriptions);
    const rtName = getName(emulator, "rt", mappings, descriptions);

    return (
      <>
        {this.renderControl('start', 'Toggle Keypad Display')}
        {this.renderControl('dpad', 'Joystick')}
        {aName && this.renderControl('a', aName)}
        {bName && this.renderControl('b', bName)}
        {xName && this.renderControl('x', xName)}
        {yName && this.renderControl('y', yName)}
        {lbName && this.renderControl('lbump', lbName)}
        {rbName && this.renderControl('rbump', rbName)}
        {ltName && this.renderControl('ltrig', ltName)}
        {rtName && this.renderControl('rtrig', rtName)}
      </>
    );
  }
}

export class KeyboardControlsTab extends ControlsTab {
  render() {
    const { emulator } = this.props;
    const mappings = emulator.mappings;
    let descriptions = emulator.getApp().descriptions;
    if (!descriptions) descriptions = {}

    const aName = getName(emulator, "a", mappings, descriptions);
    const bName = getName(emulator, "b", mappings, descriptions);
    const xName = getName(emulator, "x", mappings, descriptions);
    const yName = getName(emulator, "y", mappings, descriptions);
    const lbName = getName(emulator, "lb", mappings, descriptions);
    const rbName = getName(emulator, "rb", mappings, descriptions);
    const ltName = getName(emulator, "lt", mappings, descriptions);
    const rtName = getName(emulator, "rt", mappings, descriptions);

    return (
      <>
        {this.renderKey('Enter', 'Toggle Keypad Display')}
        {this.renderKey('ArrowUp', 'Joystick Up')}
        {this.renderKey('ArrowDown', 'Joystick Down')}
        {this.renderKey('ArrowLeft', 'Joystick Left')}
        {this.renderKey('ArrowRight', 'Joystick Right')}
        {aName && this.renderKey('KeyZ', aName)}
        {bName && this.renderKey('KeyX', bName)}
        {xName && this.renderKey('KeyA', xName)}
        {yName && this.renderKey('KeyS', yName)}
        {lbName && this.renderKey('KeyW', lbName)}
        {rbName && this.renderKey('KeyE', rbName)}
        {ltName && this.renderKey('KeyQ', ltName)}
        {rtName && this.renderKey('KeyR', rtName)}
        {this.renderKey('Digit1', getNameForValue(emulator, '1', descriptions))}
        {this.renderKey('Digit2', getNameForValue(emulator, '2', descriptions))}
        {this.renderKey('Digit3', getNameForValue(emulator, '3', descriptions))}
        {this.renderKey('Digit4', getNameForValue(emulator, '4', descriptions))}
        {this.renderKey('Digit5', getNameForValue(emulator, '5', descriptions))}
        {this.renderKey('Digit6', getNameForValue(emulator, '6', descriptions))}
        {this.renderKey('Digit7', getNameForValue(emulator, '7', descriptions))}
        {this.renderKey('Digit8', getNameForValue(emulator, '8', descriptions))}
        {this.renderKey('Digit9', getNameForValue(emulator, '9', descriptions))}
        {this.renderKey('Minus', getNameForValue(emulator, '*', descriptions))}
        {this.renderKey('Digit0', getNameForValue(emulator, '0', descriptions))}
        {this.renderKey('Equal', getNameForValue(emulator, '#', descriptions))}
      </>
    );
  }
}