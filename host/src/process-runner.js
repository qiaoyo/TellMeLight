import { spawn } from 'node:child_process';
import { sendEvent } from './event-client.js';

export async function runProcessWithEvents({
  command,
  args = [],
  sessionId,
  source = 'process',
  title = command,
  baseUrl,
  cwd,
  sendEventImpl = sendEvent,
  spawnImpl = spawn,
  stdio = 'inherit',
  warningStream = process.stderr,
}) {
  await sendTellMeLightEvent(sendEventImpl, startedPayload({ sessionId, source, title }), baseUrl, warningStream);

  const exitCode = await runChildProcess({
    args,
    command,
    cwd,
    spawnImpl,
    stdio,
  });

  await sendTellMeLightEvent(
    sendEventImpl,
    endedPayload({ exitCode, sessionId, source, title }),
    baseUrl,
    warningStream,
  );

  return exitCode;
}

export function startedPayload({ sessionId, source, title }) {
  return {
    source,
    session_id: sessionId,
    event: 'started',
    state: 'running',
    title,
  };
}

export function endedPayload({ exitCode, sessionId, source, title }) {
  return {
    source,
    session_id: sessionId,
    event: 'ended',
    outcome: exitCode === 0 ? 'success' : 'error',
    title,
  };
}

async function sendTellMeLightEvent(sendEventImpl, payload, baseUrl, warningStream) {
  try {
    await sendEventImpl(payload, { baseUrl });
  } catch (error) {
    warningStream?.write?.(`TellMeLight event warning: ${error.message}\n`);
  }
}

function runChildProcess({ command, args, cwd, spawnImpl, stdio }) {
  return new Promise((resolve) => {
    let settled = false;
    const child = spawnImpl(command, args, {
      cwd,
      shell: false,
      stdio,
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
        resolve(typeof code === 'number' ? code : 1);
      }
    });
  });
}
