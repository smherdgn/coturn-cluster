// shared/src/utils.ts
import { v4 as uuidv4 } from 'uuid';
import { BaseMessage } from './messages';

export const generateId = (): string => uuidv4();

export const getCurrentTimestamp = (): string => new Date().toISOString();

export const createBaseMessage = (
  channel: string,
  data: any,
  source: string,
  target: string = 'all'
): BaseMessage => ({
  id: generateId(),
  timestamp: getCurrentTimestamp(),
  source,
  target,
  channel,
  data
});

export const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

export const parseMessage = (data: string): any => {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Invalid JSON message: ${error}`);
  }
};

export const stringifyMessage = (message: any): string => {
  try {
    return JSON.stringify(message);
  } catch (error) {
    throw new Error(`Failed to stringify message: ${error}`);
  }
};