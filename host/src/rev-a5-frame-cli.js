import { pathToFileURL } from 'node:url';
import { buildRevA5Frame, serializeRevA5Frame } from './rev-a5-frame.js';

const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';

export function parseRevA5FrameCliArgs(args) {
  const parsed = {
    baseUrl: DEFAULT_BASE_URL,
    brightness: 0.12,
  };

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Flag ${flag} requires a value`);
    }

    if (flag === '--url') {
      parsed.baseUrl = value;
    } else if (flag === '--brightness') {
      parsed.brightness = Number(value);
    } else {
      throw new Error(`Unexpected flag: ${flag}`);
    }
    index += 1;
  }

  return parsed;
}

export async function runRevA5FrameCli(
  args = process.argv.slice(2),
  { fetchSnapshot = getSnapshot, output = process.stdout } = {}
) {
  const options = parseRevA5FrameCliArgs(args);
  const snapshot = await fetchSnapshot(`${options.baseUrl}/v1/slots`);
  const frame = buildRevA5Frame(snapshot, { brightness: options.brightness });
  output.write(serializeRevA5Frame(frame));
  return frame;
}

async function getSnapshot(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Host Bridge returned HTTP ${response.status}`);
  }
  return response.json();
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  runRevA5FrameCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

