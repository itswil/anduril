import type { MachineConfig, MachineOptions } from "xstate";
import { assign, createMachine } from "xstate";

type Context = {
  brightness: (typeof BRIGHTNESS)[keyof typeof BRIGHTNESS];
  lastStrobeMode: (typeof STROBE_MODE)[keyof typeof STROBE_MODE];
  ui: (typeof UI)[keyof typeof UI];
};

type Schema = {
  states: {
    lightOff: {};
    lightOn: {};
    batteryCheck: {};
    tintRamping: {};
    lockoutMode: {};
    factoryReset: {};
    versionCheck: {};
    temperatureCheck: {};
    beaconMode: {};
    sosMode: {};
    strobeModeEntryPoint: {};
    [STROBE_MODE.CANDLE]: {};
    [STROBE_MODE.BIKE_FLASH]: {};
    [STROBE_MODE.PARTY]: {};
    [STROBE_MODE.TACTICAL]: {};
    [STROBE_MODE.LIGHTNING]: {};
  };
};

type Event =
  | { type: "1C" }
  | { type: "1H" }
  | { type: "2C" }
  | { type: "2H" }
  | { type: "3C" }
  | { type: "3H" }
  | { type: "4C" }
  | { type: "10C" }
  | { type: "10H" }
  | { type: "13H" }
  | { type: "15C" };

const UI = {
  SIMPLE: "SIMPLE",
  ADVANCED: "ADVANCED",
} as const;

const BRIGHTNESS = {
  DEFAULT: 50,
  MAX: 100,
  MIN: 10,
};

const STROBE_MODE = {
  CANDLE: "candleMode",
  BIKE_FLASH: "bikeFlashMode",
  PARTY: "partyStrobeMode",
  TACTICAL: "tacticalStrobeMode",
  LIGHTNING: "lightningStrobeMode",
} as const;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const invokeDisplayVersion = async () => {
  await sleep(3000);
};

const invokeFactoryReset = async () => {
  await sleep(3000);
};

const andurilConfig: MachineConfig<Context, Schema, Event> = {
  id: "anduril",
  initial: "lightOff",
  context: {
    brightness: BRIGHTNESS.DEFAULT,
    lastStrobeMode: STROBE_MODE.CANDLE,
    ui: UI.SIMPLE,
  },
  states: {
    lightOff: {
      entry: ["turnLightOff"],
      on: {
        "1C": { target: "lightOn" },
        "1H": { actions: ["setBrightnessMin"], target: "lightOn" },
        "2C": { actions: ["setBrightnessMax"], target: "lightOn" },
        "3C": { target: "batteryCheck", cond: "isAdvancedUi" },
        "3H": { target: "strobeModeEntryPoint", cond: "isAdvancedUi" },
        "4C": { target: "lockoutMode" },
        "10C": { actions: ["setUiModeToSimple"], cond: "isAdvancedUi" },
        "10H": { actions: ["setUiModeToAdvanced"], cond: "isSimpleUi" },
        "13H": { target: "factoryReset" },
        "15C": { target: "versionCheck" },
      },
    },

    lightOn: {
      entry: ["turnLightOn"],
      on: {
        "1C": { target: "lightOff" },
        "1H": { actions: ["increaseBrightness"] },
        "2C": { actions: ["setBrightnessMax"] },
        "2H": { actions: ["decreaseBrightness"] },
        "3H": { target: "tintRamping" },
        "4C": { target: "lockoutMode" },
      },
    },

    tintRamping: {},

    lockoutMode: {
      on: {
        "3C": { target: "lightOff" },
        "4C": { target: "lightOn" },
      },
    },

    factoryReset: {
      invoke: {
        id: "factoryReset",
        src: invokeFactoryReset,
        onDone: "lightOff",
      },
    },

    versionCheck: {
      invoke: {
        id: "displayVersion",
        src: invokeDisplayVersion,
        onDone: "lightOff",
      },
    },

    batteryCheck: {
      entry: ["enterBatteryCheck"],
      exit: ["exitBatteryCheck"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "temperatureCheck" },
      },
    },

    temperatureCheck: {
      entry: ["enterTemperatureCheck"],
      exit: ["exitTemperatureCheck"],
      on: {
        "2C": { target: "beaconMode" },
      },
    },

    beaconMode: {
      entry: ["enterBeaconMode"],
      exit: ["exitBeaconMode"],
      on: {
        "2C": { target: "sosMode" },
      },
    },

    sosMode: {
      entry: ["enterSosMode"],
      exit: ["exitSosMode"],
      on: {
        "2C": { target: "batteryCheck" },
      },
    },

    strobeModeEntryPoint: {
      always: Object.values(STROBE_MODE).map((mode) => ({
        cond: (context) => context.lastStrobeMode === mode,
        target: mode,
      })),
    },

    [STROBE_MODE.CANDLE]: {
      entry: ["enterCandleMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "bikeFlashMode" },
      },
    },

    [STROBE_MODE.BIKE_FLASH]: {
      entry: ["enterBikeFlashMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "partyStrobeMode" },
      },
    },

    [STROBE_MODE.PARTY]: {
      entry: ["enterPartyStrobeMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "tacticalStrobeMode" },
      },
    },

    [STROBE_MODE.TACTICAL]: {
      entry: ["enterTacticalStrobeMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "lightningStrobeMode" },
      },
    },

    [STROBE_MODE.LIGHTNING]: {
      entry: ["LightningStrobeMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "candleMode" },
      },
    },
  },
};

let intervalId: number | undefined;

const andurilOptions: MachineOptions<Context, Event> = {
  actions: {
    enterBatteryCheck: () => {
      console.log("enterBatteryCheck");
      intervalId = setInterval(
        () => console.log("Displaying: Battery Level"),
        1000
      );
    },
    exitBatteryCheck: () => {
      clearInterval(intervalId);
      console.log("exitBatteryCheck");
    },

    enterTemperatureCheck: () => {
      console.log("enterTemperatureCheck");
      intervalId = setInterval(
        () => console.log("Displaying: Temperature"),
        1000
      );
    },
    exitTemperatureCheck: () => {
      clearInterval(intervalId);
      console.log("exitTemperatureCheck");
    },

    enterBeaconMode: () => {
      console.log("enterBeaconMode");
      intervalId = setInterval(
        () => console.log("Displaying: Beacon Mode"),
        1000
      );
    },
    exitBeaconMode: () => {
      clearInterval(intervalId);
      console.log("exitBeaconMode");
    },

    enterSosMode: () => {
      console.log("enterSosMode");
      intervalId = setInterval(() => console.log("Displaying: SOS Mode"), 1000);
    },
    exitSosMode: () => {
      clearInterval(intervalId);
      console.log("exitSosMode");
    },

    enterBikeFlashMode: assign({ lastStrobeMode: STROBE_MODE.BIKE_FLASH }),
    enterCandleMode: assign({ lastStrobeMode: STROBE_MODE.CANDLE }),
    enterPartyStrobeMode: assign({ lastStrobeMode: STROBE_MODE.PARTY }),
    enterTacticalStrobeMode: assign({ lastStrobeMode: STROBE_MODE.TACTICAL }),
    enterLightningStrobeMode: assign({ lastStrobeMode: STROBE_MODE.LIGHTNING }),

    decreaseBrightness: assign({
      brightness: (context) => context.brightness - 1,
    }),
    increaseBrightness: assign({
      brightness: (context) => context.brightness + 1,
    }),

    setBrightnessMax: assign({ brightness: BRIGHTNESS.MAX }),
    setBrightnessMin: assign({ brightness: BRIGHTNESS.MIN }),

    setUiModeToAdvanced: assign({ ui: UI.ADVANCED }),
    setUiModeToSimple: assign({ ui: UI.SIMPLE }),

    turnLightOn: (context) => {
      console.log(`Light ON: ${context.brightness}%`);
    },
    turnLightOff: () => {
      console.log("Light OFF");
    },
  },

  guards: {
    isAdvancedUi: (context) => context.ui === UI.ADVANCED,
    isSimpleUi: (context) => context.ui === UI.SIMPLE,
  },
};

const andurilStateMachine = createMachine(andurilConfig, andurilOptions);
