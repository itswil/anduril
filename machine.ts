import type { MachineConfig, MachineOptions } from "xstate";
import { assign, createMachine } from "xstate";

type Context = {
  brightness: number;
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
    candleMode: {};
    bikeFlashMode: {};
    partyStrobeMode: {};
    tacticalStrobeMode: {};
    lightningStormMode: {};
  };
};

type Event =
  | { type: "1C" }
  | { type: "2C" }
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

const sleep = (ms: number) =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          status: "COMPLETED",
        }),
      ms
    )
  );

const invokeDisplayVersion = async () => {
  const response = await sleep(3000);
  console.log(response);
  return response;
};

const invokeFactoryReset = async () => {
  const response = await sleep(3000);
  console.log(response);
  return response;
};

const andurilConfig: MachineConfig<Context, Schema, Event> = {
  id: "anduril",
  initial: "lightOff",
  context: {
    brightness: 50,
    ui: UI.SIMPLE,
  },
  states: {
    lightOff: {
      on: {
        "1C": {
          actions: ["turnLightOn"],
          target: "lightOn",
        },
        "3C": { target: "batteryCheck", cond: "isAdvancedUi" },
        "3H": { target: "candleMode", cond: "isAdvancedUi" },
        "4C": { target: "lockoutMode" },
        "10C": { actions: ["setUiModeToSimple"], cond: "isAdvancedUi" },
        "10H": { actions: ["setUiModeToAdvanced"], cond: "isSimpleUi" },
        "13H": { target: "factoryReset" },
        "15C": { target: "versionCheck" },
      },
    },

    lightOn: {
      on: {
        "1C": {
          actions: ["turnLightOff"],
          target: "lightOff",
        },
        // "3H": { target: "tintRamping" },
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

    candleMode: {
      entry: ["enterCandleMode"],
      exit: ["exitCandleMode"],
      on: {
        "1C": { target: "lightOff" },
        "2C": { target: "bikeFlashMode" },
      },
    },

    bikeFlashMode: {
      entry: ["enterBikeFlashMode"],
      exit: ["exitBikeFlashMode"],
      on: {
        "2C": { target: "partyStrobeMode" },
      },
    },

    partyStrobeMode: {
      entry: ["enterPartyStrobeMode"],
      exit: ["exitPartyStrobeMode"],
      on: {
        "2C": { target: "tacticalStrobeMode" },
      },
    },

    tacticalStrobeMode: {
      entry: ["enterTacticalStrobeMode"],
      exit: ["exitTacticalStrobeMode"],
      on: {
        "2C": { target: "lightningStormMode" },
      },
    },

    lightningStormMode: {
      entry: ["LightningStormMode"],
      exit: ["LightningStormMode"],
      on: {
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

    enterCandleMode: () => {
      console.log("enterCandleMode");
      intervalId = setInterval(
        () => console.log("Displaying: Candle Mode"),
        1000
      );
    },
    exitCandleMode: () => {
      clearInterval(intervalId);
      console.log("exitCandleMode");
    },

    enterBikeFlashMode: () => {
      console.log("enterBikeFlashMode");
      intervalId = setInterval(
        () => console.log("Displaying: Bike Flash Mode"),
        1000
      );
    },
    exitBikeFlashMode: () => {
      clearInterval(intervalId);
      console.log("exitBikeFlashMode");
    },

    enterPartyStrobeMode: () => {
      console.log("enterPartyStrobeMode");
      intervalId = setInterval(
        () => console.log("Displaying: Party Strobe Mode"),
        1000
      );
    },
    exitPartyStrobeMode: () => {
      clearInterval(intervalId);
      console.log("exitPartyStrobeMode");
    },

    enterTacticalStrobeMode: () => {
      console.log("enterTacticalStrobeMode");
      intervalId = setInterval(
        () => console.log("Displaying: Tactical Strobe Mode"),
        1000
      );
    },
    exitTacticalStrobeMode: () => {
      clearInterval(intervalId);
      console.log("exitTacticalStrobeMode");
    },

    enterLightningStrobeMode: () => {
      console.log("enterLightningStrobeMode");
      intervalId = setInterval(
        () => console.log("Displaying: Lightning Strobe Mode"),
        1000
      );
    },
    exitLightningStrobeMode: () => {
      clearInterval(intervalId);
      console.log("exitLightningStrobeMode");
    },

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
