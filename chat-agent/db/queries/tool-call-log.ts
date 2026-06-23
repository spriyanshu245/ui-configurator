import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export const toolCallLog = {
  log: async (sessionId: string, toolName: string, input: object, output: object, success: boolean, durationMs: number) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.collection('tool_call_log').insertOne({
      id,
      sessionId,
      toolName,
      input,
      output,
      success,
      durationMs,
      createdAt: now
    });

    return id;
  }
};
