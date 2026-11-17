/// <reference types="vite/client" />
import type { systemCheckApi } from '../preload/index';

declare global {
  interface Window {
    systemCheckApi: typeof systemCheckApi;
  }
}
