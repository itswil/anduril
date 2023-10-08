import type { MachineConfig, MachineOptions } from "xstate";
import { assign, createMachine } from "xstate";

type Context = {
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
  };
};

type Event =
  | { type: "1C" }
  | { type: "3C" }
  | { type: "3C" }
  | { type: "4C" }
  | { type: "10C" }
  | { type: "10H" }
  | { type: "13H" }
  | { type: "15C" };

const UI = {
  SIMPLE: "SIMPLE",
  ADVANCED: "ADVANCED",
} as const;

let batteryStatusInterval: number | undefined;

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
    ui: UI.SIMPLE,
  },
  states: {
    lightOff: {
      on: {
        "1C": {
          actions: ["turnLightOn"],
          target: "lightOn",
        },
        "3C": { target: "batteryCheck" },
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

    batteryCheck: {
      entry: ["displayBatteryStatus"],
      exit: ["cancelDisplayBatteryStatus"],
      on: {
        "1C": { target: "lightOff" },
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
  },
};

const andurilOptions: MachineOptions<Context, Event> = {
  actions: {
    cancelDisplayBatteryStatus: () => {
      clearInterval(batteryStatusInterval);
      console.log("batteryStatusInterval cleared");
    },
    displayBatteryStatus: () => {
      batteryStatusInterval = setInterval(
        () => console.log("Your battery status is: ..."),
        2000
      );
      console.log("batteryStatusInterval created", batteryStatusInterval);
    },

    setUiModeToAdvanced: assign({ ui: UI.ADVANCED }),
    setUiModeToSimple: assign({ ui: UI.SIMPLE }),

    turnLightOn: () => {
      console.log("Light is ON");
    },
    turnLightOff: () => {
      console.log("Light is OFF");
    },
  },

  guards: {
    isAdvancedUi: (context) => context.ui === UI.ADVANCED,
    isSimpleUi: (context) => context.ui === UI.SIMPLE,
  },
};

const andurilStateMachine = createMachine(andurilConfig, andurilOptions);
