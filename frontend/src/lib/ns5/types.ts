export type Role = "ns5" | "user";

export interface Message {
  id: string;
  role: Role;
  text: string;
  createdAt: number;
  /** True while NS-5 is still typing this message. */
  streaming?: boolean;
}

export interface Session {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}
