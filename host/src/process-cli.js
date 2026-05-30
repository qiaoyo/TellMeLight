import { pathToFileURL } from 'node:url';
import { runProcessWithEvents } from './process-runner.js';

const USAGE = 'Usage: tml-run [--source name] [--id session-id] [--title title] [--url bridge-url] [--cwd path] -- command [args...]';

export function parseProcessCliArgs(args, { idFactory = defaultProcessSessionId } = {}) {
  const separatorIndex = args.indexOf('--');
  if (separatorIndex === -1) {
    throw new Error('-- separator is required');
  }

  const flags = parseFlags(args.slice(0, separatorIndex));
  const [command, ...commandArgs] = args.slice(separatorIndex + 1);
  if (!command) {
    throw new Error('command is required');
  }

  const source = flags.source ?? 'process';
  return {
    baseUrl: flags.url,
    command,
    args: commandArgs,
    cwd: flags.cwd,
    sessionId: flags.id ?? idFactory({ source, command, args: commandArgs }),
    source,
    title: flags.title ?? [command, ...commandArgs].join(' '),
  };
}

export async function runProcessCli(args = process.argv.slice(2)) {
  const config = parseProcessCliArgs(args);
  return runProcessWithEvents(config);
}

function parseFlags(args) {
  const flags = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`);
    }

    const name = key.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Flag ${key} requires a value`);
    }

    flags[name] = value;
    index += 1;
  }
  return flags;
}

function defaultProcessSessionId({ source }) {
  return `${source}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  runProcessCli()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(`${error.message}\n${USAGE}`);
      process.exitCode = 1;
    });
}
