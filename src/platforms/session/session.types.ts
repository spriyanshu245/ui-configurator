import { SessionState } from "./enums";
export interface UserDetails {
  userId?: string;
  username?: string;
  roles?: string[];
  accessToken?: string;
}
export interface SessionManagerState {
  state: SessionState;
  lastActivityTime: number;
  tokenLastRefreshed: number;
  isRefreshing: boolean;
  userDetails: UserDetails | null;
}

export type Subscriber = (state: SessionManagerState) => void;
