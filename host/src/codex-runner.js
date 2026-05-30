import { spawn } from 'node:child_process';
import { sendEvent } from './event-client.js';
import {
  codexEndedPayload,
  createCodexEventContext,
  fallbackCodexStartedPayload,
  mapCodexEventToTellMeLight,
} from './codex-event-mapper.js';

export async function runCodexJsonSession({
  command = 'codex',
  args = [],
  baseUrl,
  cwd,
  env = process.env,
  title,
  sendEventImpl = sendEvent,
  spawnImpl = spawn,
  stdout = process.stdout,
  stderr = process.stderr,
  warningStream = process.stderr,
}) {
  const context = createCodexEventContext({ title });
  let eventChain = Promise.resolve();
  let buffer = '';
  let started = false;

  function enqueue(payload) {
    if (!payload) {
      return;
    }

    if (payload.event === 'started') {
      started = true;
    }

    eventChain = eventChain
      .then(() => sendEventImpl(payload, { baseUrl }))
      .catch((error) => {
        warningStream?.write?.(`TellMeLight Codex event warning: ${error.message}\n`);
      });
  }

  function handleLine(line) {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      enqueue(mapCodexEventToTellMeLight(JSON.parse(trimmed), context));
    } catch {
      // Codex can print non-JSON diagnostics around JSONL; those lines are pass-through only.
    }
  }

  const exitCode = await new Promise((resolve) => {
    let settled = false;
    const child = spawnImpl(command, args, {
      cwd,
      env,
      shell: false,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    child.stdout?.on?.('data', (chunk) => {
      const text = String(chunk);
      stdout?.write?.(text);
      buffer += text;

      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        handleLine(line);
      }
    });

    child.stderr?.on?.('data', (chunk) => {
      stderr?.write?.(String(chunk));
    });

    child.on('error', () => {
      if (!settled) {
        settled = true;
        resolve(1);
      }
    });

    child.on('exit', (code) => {
      if (!settled) {
        settled = true;
        if (buffer) {
          handleLine(buffer);
          buffer = '';
        }
        resolve(typeof code === 'number' ? code : 1);
      }
    });
  });

  if (!started) {
    enqueue(fallbackCodexStartedPayload(context));
  }

  if (!context.ended) {
    enqueue(codexEndedPayload(context, exitCode === 0 ? 'success' : 'error'));
  }

  await eventChain;
  return exitCode;
}
