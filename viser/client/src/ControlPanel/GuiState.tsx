import * as Messages from "../WebsocketMessages";
import React from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

export type GuiConfig =
  | Messages.GuiAddButtonMessage
  | Messages.GuiAddCheckboxMessage
  | Messages.GuiAddDropdownMessage
  | Messages.GuiAddFolderMessage
  | Messages.GuiAddTabsMessage
  | Messages.GuiAddNumberMessage
  | Messages.GuiAddRgbMessage
  | Messages.GuiAddRgbaMessage
  | Messages.GuiAddSliderMessage
  | Messages.GuiAddButtonGroupMessage
  | Messages.GuiAddTextMessage
  | Messages.GuiAddVector2Message
  | Messages.GuiAddVector3Message;

interface GuiState {
  theme: Messages.ThemeConfigurationMessage;
  label: string;
  server: string;
  websocketConnected: boolean;
  backgroundAvailable: boolean;
  // We use an object whose values are always null to emulate a set.
  // TODO: is there a less hacky way?
  guiIdSetFromContainerId: {
    [containerId: string]: { [configId: string]: null } | undefined;
  };
  guiConfigFromId: { [id: string]: GuiConfig };
  guiValueFromId: { [id: string]: any };
  guiAttributeFromId: {
    [id: string]: { visible?: boolean; disabled?: boolean } | undefined;
  };
}

interface GuiActions {
  setTheme: (theme: Messages.ThemeConfigurationMessage) => void;
  addGui: (config: GuiConfig) => void;
  setGuiValue: (id: string, value: any) => void;
  setGuiVisible: (id: string, visible: boolean) => void;
  setGuiDisabled: (id: string, visible: boolean) => void;
  removeGui: (id: string) => void;
  resetGui: () => void;
}

const cleanGuiState: GuiState = {
  theme: {
    type: "ThemeConfigurationMessage",
    titlebar_content: null,
    fixed_sidebar: false,
  },
  label: "",
  server: "ws://localhost:8080", // Currently this will always be overridden.
  websocketConnected: false,
  backgroundAvailable: false,
  guiIdSetFromContainerId: {},
  guiConfigFromId: {},
  guiValueFromId: {},
  guiAttributeFromId: {},
};

export function useGuiState(initialServer: string) {
  return React.useState(() =>
    create(
      immer<GuiState & GuiActions>((set) => ({
        ...cleanGuiState,
        server: initialServer,
        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }),
        addGui: (guiConfig) =>
          set((state) => {
            state.guiConfigFromId[guiConfig.id] = guiConfig;
            state.guiIdSetFromContainerId[guiConfig.container_id] = {
              ...state.guiIdSetFromContainerId[guiConfig.container_id],
              [guiConfig.id]: null,
            };
          }),
        setGuiValue: (id, value) =>
          set((state) => {
            state.guiValueFromId[id] = value;
          }),
        setGuiVisible: (id, visible) =>
          set((state) => {
            state.guiAttributeFromId[id] = {
              ...state.guiAttributeFromId[id],
              visible: visible,
            };
          }),
        setGuiDisabled: (id, disabled) =>
          set((state) => {
            state.guiAttributeFromId[id] = {
              ...state.guiAttributeFromId[id],
              disabled: disabled,
            };
          }),
        removeGui: (id) =>
          set((state) => {
            const guiConfig = state.guiConfigFromId[id];
            delete state.guiIdSetFromContainerId[guiConfig.container_id]![
              guiConfig.id
            ];
            delete state.guiConfigFromId[id];
            delete state.guiValueFromId[id];
            delete state.guiAttributeFromId[id];
          }),
        resetGui: () =>
          set((state) => {
            state.guiIdSetFromContainerId = {};
            state.guiConfigFromId = {};
            state.guiValueFromId = {};
            state.guiAttributeFromId = {};
          }),
      }))
    )
  )[0];
}

/** Type corresponding to a zustand-style useGuiState hook. */
export type UseGui = ReturnType<typeof useGuiState>;
