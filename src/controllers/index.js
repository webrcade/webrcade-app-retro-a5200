import React, { Component } from "react";

import {
  A5200Controller,
  GamepadEnum,
  ImageButton,
  KCODES,
  Screen,
  WebrcadeContext
} from '@webrcade/app-common';

import './style.scss'

export class ControllerButton extends ImageButton {
  render() {
    const { buttonRef, isTop, ...other } = this.props;

    const className = "controller-image-button" + (isTop ? " controller-image-button-top": "");

    return (
      <ImageButton
        ref={buttonRef}
        className={className}
        {...other}
      />
    );
  }
}

export class Controller extends Component {

  constructor() {
    super();

    this.buttonRefs = [
      [React.createRef(), React.createRef(), React.createRef()],
      [React.createRef(), React.createRef(), React.createRef()],
      [React.createRef(), React.createRef(), React.createRef()],
      [React.createRef(), React.createRef(), React.createRef()],
      [React.createRef(), React.createRef(), React.createRef()]
    ];

    this.descriptionKey = [
      ["start", "pause", "reset"],
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["*", "0", "#"]
    ];
  }

  render() {
    const { buttonRefs, descriptionKey } = this;
    const { controllerIndex, emulator, descriptions, row, col, onFocusChanged, onSelect } = this.props;

    const updateDescription = (r, c) => {
      setTimeout(() => {
        const row = document.getElementById("controller-description-row");
        if (!row) return;

        let description = "";

        if (r >= 0 && c >= 0) {
          if (descriptions) {
            const keyName = descriptionKey[r][c];
            description = descriptions[keyName]
            if (!description) {
              if (keyName === "start") {
                description = "Start";
              } else if (keyName === "pause") {
                description = "Pause";
              } else if (keyName === "reset") {
                description = "Reset";
              }
            }

            if (!description) {
              description = "";
            } else {
              if (row.innerHTML !== description) {
                row.classList.remove("description-fade-in");
                setTimeout(() => {
                  row.classList.add("description-fade-in");
                }, 50);
              }
            }
          }
        }

        row.innerHTML = description;
      }, 0);
    }

    updateDescription(row, col);

    setTimeout(() => {
      if (row >= 0 && col >= 0) {
        const buttonRef = buttonRefs[row][col];
        if (buttonRef.current) {
          buttonRef.current.focus()
        }
      }
    }, 0);

    const onClick = (e, key) => {
      if (e && e.type && e.type === GamepadEnum.A) {
        if (e.index !== controllerIndex) {
          return;
        }
      }

      // Skip keystrokes (enter, space, etc.)
      if (e.clientX !== undefined && e.clientX === 0) {
        return;
      }

      onSelect(key);
    }

    return (
      <div className="controller"
        style={{
          backgroundImage: "url(" + A5200Controller + ")",
        }}
      >
        <div className="controller-row controller-first-row">
          <div className="controller-row-button controller-row-button-top">
            <ControllerButton
              isTop={true}
              buttonRef={buttonRefs[0][0]}
              onFocus={() => onFocusChanged(0, 0)}
              onClick={(e) => onClick(e, emulator.JST_START)}
              onMouseEnter={() => updateDescription(0, 0)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button controller-row-button-top">
            <ControllerButton
              isTop={true}
              buttonRef={buttonRefs[0][1]}
              onFocus={() => onFocusChanged(0, 1)}
              onClick={(e) => onClick(e, emulator.JST_PAUSE)}
              onMouseEnter={() => updateDescription(0, 1)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button controller-row-button-top">
            <ControllerButton
              isTop={true}
              buttonRef={buttonRefs[0][2]}
              onFocus={() => onFocusChanged(0, 2)}
              onClick={(e) => onClick(e, emulator.JST_RESET)}
              onMouseEnter={() => updateDescription(0, 2)}
              onMouseLeave={() => updateDescription(row, col)}

            />
          </div>
        </div>
        <div className="controller-row controller-second-row">
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[1][0]}
              onFocus={() => onFocusChanged(1, 0)}
              onClick={(e) => onClick(e, emulator.JST_1)}
              onMouseEnter={() => updateDescription(0, 0)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[1][1]}
              onFocus={() => onFocusChanged(1, 1)}
              onClick={(e) => onClick(e, emulator.JST_2)}
              onMouseEnter={() => updateDescription(0, 1)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[1][2]}
              onFocus={() => onFocusChanged(1, 2)}
              onClick={(e) => onClick(e, emulator.JST_3)}
              onMouseEnter={() => updateDescription(0, 2)}
              onMouseLeave={() => updateDescription(row, col)}

            />
          </div>
        </div>
        <div className="controller-row">
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[2][0]}
              onFocus={() => onFocusChanged(2, 0)}
              onClick={(e) => onClick(e, emulator.JST_4)}
              onMouseEnter={() => updateDescription(1, 0)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[2][1]}
              onFocus={() => onFocusChanged(2, 1)}
              onClick={(e) => onClick(e, emulator.JST_5)}
              onMouseEnter={() => updateDescription(1, 1)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[2][2]}
              onFocus={() => onFocusChanged(2, 2)}
              onClick={(e) => onClick(e, emulator.JST_6)}
              onMouseEnter={() => updateDescription(1, 2)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
        </div>
        <div className="controller-row">
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[3][0]}
              onFocus={() => onFocusChanged(3, 0)}
              onClick={(e) => onClick(e, emulator.JST_7)}
              onMouseEnter={() => updateDescription(2, 0)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[3][1]}
              onFocus={() => onFocusChanged(3, 1)}
              onClick={(e) => onClick(e, emulator.JST_8)}
              onMouseEnter={() => updateDescription(2, 1)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[3][2]}
              onFocus={() => onFocusChanged(3, 2)}
              onClick={(e) => onClick(e, emulator.JST_9)}
              onMouseEnter={() => updateDescription(2, 2)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
        </div>
        <div className="controller-row">
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[4][0]}
              onFocus={() => onFocusChanged(4, 0)}
              onClick={(e) => onClick(e, emulator.JST_STAR)}
              onMouseEnter={() => updateDescription(3, 0)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[4][1]}
              onFocus={() => onFocusChanged(4, 1)}
              onClick={(e) => onClick(e, emulator.JST_0)}
              onMouseEnter={() => updateDescription(3, 1)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
          <div className="controller-row-button">
            <ControllerButton
              buttonRef={buttonRefs[4][2]}
              onFocus={() => onFocusChanged(4, 2)}
              onClick={(e) => onClick(e, emulator.JST_POUND)}
              onMouseEnter={() => updateDescription(3, 2)}
              onMouseLeave={() => updateDescription(row, col)}
            />
          </div>
        </div>
        <div id="controller-description-row" className="controller-row controller-description-row"></div>
      </div>
    );
  }
}

export class ControllersScreen extends Screen {
  constructor() {
    super();

    this.gamepadNotifier.setImmediateA(true);
    this.state = {
      controllerIndex: null,
      controllerSwap: false,
      row: 1,
      col: 0
    };
  }

  ModeEnum = {};

  componentDidMount() {
    const { controllerIndex } = this.state;

    super.componentDidMount();
    const docElement = document.documentElement;
    docElement.addEventListener("keydown", this.handleKeyDownEvent);

    if (controllerIndex === null) {
      this.setState({
        controllerIndex: this.props.controllerIndex,
        controllerSwap: this.props.controllerSwap
      });
    }
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    const docElement = document.documentElement;
    docElement.removeEventListener("keydown", this.handleKeyDownEvent);
  }

  focus() {
    const { row, col } = this.state;
    if (this.gamepadNotifier.padCount > 0) {
      if (row < 0 || col < 0 ) {
        this.setState({row: 0, col: 0});
      }
    }
  }

  globalGamepadCallback = e => {
    const { controllerIndex, row, col } = this.state;
    let newCol = col;
    let newRow = row;

    if (controllerIndex !== e.index) return;

    if (row >= 0 && col >= 0) {
      if (e.type === GamepadEnum.LEFT) {
        if (col > 0) newCol = col - 1;
      } else if (e.type === GamepadEnum.RIGHT) {
        if (col < 2) newCol = col + 1;
      } else if (e.type === GamepadEnum.UP) {
        if (row > 0) newRow = row - 1;
      } else if (e.type === GamepadEnum.DOWN) {
        if (row < 4) newRow = row + 1;
      }

      this.setState({row: newRow, col: newCol});
    }

    if (e.type === GamepadEnum.ESC || e.type === GamepadEnum.START) {
      this.close();
    }
  }

  handleKeyDownEvent = (e) => {
    const { controllerIndex, row, col } = this.state;
    const { emulator, onSelect } = this.props;

    if (e.code === KCODES.SPACE_BAR || e.code === KCODES.ENTER) {
      const keys = [
        emulator.JST_START,
        emulator.JST_PAUSE,
        emulator.JST_RESET,
        emulator.JST_1,
        emulator.JST_2,
        emulator.JST_3,
        emulator.JST_4,
        emulator.JST_5,
        emulator.JST_6,
        emulator.JST_7,
        emulator.JST_8,
        emulator.JST_9,
        emulator.JST_STAR,
        emulator.JST_0,
        emulator.JST_POUND,
      ]

      if (controllerIndex === 0) {
        if (row >= 0 && col >= 0) {
            this.close();
            onSelect(keys[row * 3 + col], e.code);
        } else if (e.code === KCODES.ENTER) {
          this.close();
        }
      }
    }
  }

  handleKeyUpEvent = (e) => {
    let { controllerIndex, row, col } = this.state;

    if (controllerIndex === 0) {
      let invalid = false;
      let key = false;
      if (row < 0) {
        invalid = true;
        row = 0;
      }
      if (col < 0) {
        col = 0;
        invalid = true;
      }
      let newRow = row;
      let newCol = col;
      if (e.code === KCODES.ARROW_LEFT) {
        key = true;
        if (col > 0) newCol = col - 1;
      } else if (e.code === KCODES.ARROW_RIGHT) {
        key = true;
        if (col < 2) newCol = col + 1;
      } else if (e.code === KCODES.ARROW_UP) {
        key = true;
        if (row > 0) newRow = row - 1;
      } else if (e.code === KCODES.ARROW_DOWN) {
        key = true;
        if (row < 4) newRow = row + 1;
      }

      if (invalid && key) {
        this.setState({row: 0, col: 0});
      } else {
        if (col !== newCol || row !== newRow) {
          this.setState({row: newRow, col: newCol});
        }
      }
    }

    if (e.code === KCODES.ESCAPE) {
      this.close()
    }
  }

  onSelectFunc(key) {
    const { onSelect } = this.props;
    onSelect(key, false);
    this.close();
  }

  render() {
    const { screenContext, screenStyles } = this;
    const { controllerIndex, controllerSwap, row, col } = this.state;
    const { emulator, descriptions} = this.props;

    const onFocusChanged = (r, c) => {
      if (r >= 0 && c >= 0) {
        if (r !== row || c !== col) {
          setTimeout(() => this.setState({row: r, col: c}), 0);
        }
      }
    };

    const controller = (
      <Controller
      emulator={emulator}
      descriptions={descriptions}
      controllerIndex={controllerIndex}
      onSelect={(key) => this.onSelectFunc(key)}
      col={col}
      row={row}
      onFocusChanged={onFocusChanged} />
    )

    let cIndex = controllerIndex;
    if (controllerSwap) {
      if (cIndex === 0) {
        cIndex = 1;
      } else if (cIndex === 1) {
        cIndex = 0;
      }
    }

    return (
      <>
        <WebrcadeContext.Provider value={screenContext}>
          <div className={screenStyles['screen-transparency']} />
          <div className={"controllers-screen"}>
            <div className={'controllers-screen-inner ' + screenStyles.screen}>
              <div className={"controllers-screen-inner-controllers"}>
                {cIndex === 0 ? controller : <div/>}
                {cIndex === 1 ? controller : <div/>}
              </div>
            </div>
          </div>
        </WebrcadeContext.Provider>
      </>
    );
  }
}
