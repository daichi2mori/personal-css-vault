/// <reference types="chrome" />
declare namespace chrome {
  export namespace sidePanel {
    export function open(options?: { tabId?: number }): Promise<void>;
    export function setOptions(options: {
      path?: string;
      tabId?: number;
      enabled?: boolean;
    }): Promise<void>;
  }
}
