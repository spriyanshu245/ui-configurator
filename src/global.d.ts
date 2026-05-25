import sessionManager from "./platforms/session/SessionManagerService";
declare global {
  interface Window {
    __RAHI_SESSION_MANAGER__?: typeof sessionManager;
  }
}
export {};