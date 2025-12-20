declare module 'discord-rpc' {
  export class Client {
    constructor(options: { transport: string });
    on(event: string, callback: (...args: any[]) => void): void;
    login(options: { clientId: string }): Promise<void>;
    setActivity(activity: any): Promise<void>;
    clearActivity(): Promise<void>;
    destroy(): Promise<void>;
  }
}
