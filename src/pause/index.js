import React from 'react';
import { Component } from 'react';
import { GenPlusGxSettingsEditor } from './settings';

import { GamepadControlsTab, KeyboardControlsTab } from './controls';

import {
  CustomPauseScreen,
  EditorScreen,
  GamepadWhiteImage,
  KeyboardWhiteImage,
  PauseScreenButton,
  Resources,
  SaveStatesEditor,
  SaveWhiteImage,
  A5200Background,
  TEXT_IDS,
} from '@webrcade/app-common';

export class EmulatorPauseScreen extends Component {
  constructor() {
    super();
    this.state = {
      mode: this.ModeEnum.PAUSE,
    };
  }

  ModeEnum = {
    PAUSE: 'pause',
    CONTROLS: 'controls',
    GENPLUSGX_SETTINGS: 'genplusgx-settings',
    STATE: 'state',
  };

  ADDITIONAL_BUTTON_REFS = [React.createRef(), React.createRef(), React.createRef()];

  componentDidMount() {
    const { loaded } = this.state;
    const { emulator } = this.props;

    if (!loaded) {
      let cloudEnabled = false;
      emulator.getSaveManager().isCloudEnabled()
        .then(c => { cloudEnabled = c; })
        .finally(() => {
          this.setState({
            loaded: true,
            cloudEnabled: cloudEnabled
          });
        })
    }
  }

  render() {
    const { ADDITIONAL_BUTTON_REFS, ModeEnum } = this;
    const {
      appProps,
      closeCallback,
      emulator,
      exitCallback,
      isEditor,
      isStandalone,
    } = this.props;
    const { cloudEnabled, loaded, mode } = this.state;

    if (!loaded) {
      return null;
    }

    const additionalButtons = [
      <PauseScreenButton
        imgSrc={GamepadWhiteImage}
        buttonRef={ADDITIONAL_BUTTON_REFS[0]}
        label={Resources.getText(TEXT_IDS.VIEW_CONTROLS)}
        onHandlePad={(focusGrid, e) =>
          focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[0])
        }
        onClick={() => {
          this.setState({ mode: ModeEnum.CONTROLS });
        }}
      />,
      // <PauseScreenButton
      //   imgSrc={SettingsAppWhiteImage}
      //   buttonRef={ADDITIONAL_BUTTON_REFS[1]}
      //   label="Sega CD Settings"
      //   onHandlePad={(focusGrid, e) =>
      //     focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[1])
      //   }
      //   onClick={() => {
      //     this.setState({ mode: ModeEnum.GENPLUSGX_SETTINGS });
      //   }}
      // />,
    ]

    if (cloudEnabled) {
      additionalButtons.push(
        <PauseScreenButton
          imgSrc={SaveWhiteImage}
          buttonRef={ADDITIONAL_BUTTON_REFS[2]}
          label={Resources.getText(TEXT_IDS.SAVE_STATES)}
          onHandlePad={(focusGrid, e) =>
            focusGrid.moveFocus(e.type, ADDITIONAL_BUTTON_REFS[2])
          }
          onClick={() => {
            this.setState({ mode: ModeEnum.STATE });
          }}
        />
      );
    }

    const gamepad = <GamepadControlsTab emulator={emulator} />;
    const gamepadLabel = Resources.getText(TEXT_IDS.GAMEPAD_CONTROLS);

    return (
      <>
        {mode === ModeEnum.PAUSE ? (
          <CustomPauseScreen
            appProps={appProps}
            closeCallback={closeCallback}
            exitCallback={exitCallback}
            isEditor={isEditor}
            isStandalone={isStandalone}
            additionalButtonRefs={ADDITIONAL_BUTTON_REFS}
            additionalButtons={additionalButtons}
          />
        ) : null}
        {mode === ModeEnum.CONTROLS ? (
          <EditorScreen
            onClose={closeCallback}
            tabs={[
              {
                image: GamepadWhiteImage,
                label: gamepadLabel,
                content: gamepad,
              },
              {
                image: KeyboardWhiteImage,
                label: Resources.getText(TEXT_IDS.KEYBOARD_CONTROLS),
                content: <KeyboardControlsTab emulator={emulator} />,
              },
            ]}
          />
        ) : null}
        {mode === ModeEnum.GENPLUSGX_SETTINGS ? (
          <GenPlusGxSettingsEditor
            emulator={emulator}
            onClose={closeCallback}
          />
        ) : null}
        {mode === ModeEnum.STATE ? (
          <SaveStatesEditor
            emptyImageSrc={A5200Background}
            emulator={emulator}
            onClose={closeCallback}
            showStatusCallback={emulator.saveMessageCallback}
          />
        ) : null}
      </>
    );
  }
}
