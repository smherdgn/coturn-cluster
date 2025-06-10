import { BaseMessage } from './messages';
export declare const generateId: () => string;
export declare const getCurrentTimestamp: () => string;
export declare const createBaseMessage: (channel: string, data: any, source: string, target?: string) => BaseMessage;
export declare const sleep: (ms: number) => Promise<void>;
export declare const parseMessage: (data: string) => any;
export declare const stringifyMessage: (message: any) => string;
