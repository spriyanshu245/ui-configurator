import { db } from '../client';
import { v4 as uuidv4 } from 'uuid';

export const toolCallLog = {
  log: (sessionId: string, toolName: string, input: object, output: object, success: boolean, durationMs: number) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tool_call_log (id, sessionId, toolName, input, output, success, durationMs, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      toolName,
      JSON.stringify(input),
      JSON.stringify(output),
      success ? 1 : 0,
      durationMs,
      now
    );

    return id;
  }
};
