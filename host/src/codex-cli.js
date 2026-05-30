import { pathToFileURL } from 'node:url';

const USAGE = 'Usage: tml-codex [--tml-url url] [--tml-title title] [--tml-proxy proxy-url] [exec|resume] [codex args...]';

const TELLMELIGHT_FLAGS = new Set(['--tml-url', '--tml-title', '--tml-proxy']);

export function parseCodexCliArgs(args) {
  const { flags, codexArgs } = splitTellMeLightFlags(args);
  const commandShape = codexCommandArgs(codexArgs);

  return {
    args: commandShape.args,
    baseUrl: flags['tml-url'],
    command: 'codex',
    proxy: flags['tml-proxy'] ?? process.env.TELLMELIGHT_CODEX_PROXY,
    source: 'codex',
    title: flags['tml-title'] ?? commandShape.title,
  };
}

export function buildCodexChildEnv(baseEnv = process.env, proxy) {
  const env = { ...baseEnv };
  if (proxy) {
    env.HTTP_PROXY = proxy;
    env.HTTPS_PROXY = proxy;
    env.http_proxy = proxy;
    env.https_proxy = proxy;
  }
  return env;
}

export async function runCodexCli(args = process.argv.slice(2)) {
  const config = parseCodexCliArgs(args);
  const { runCodexJsonSession } = await import('./codex-runner.js');
  return runCodexJsonSession({
    ...config,
    env: buildCodexChildEnv(process.env, config.proxy),
  });
}

function splitTellMeLightFlags(args) {
  const flags = {};
  const codexArgs = [];

  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    if (!TELLMELIGHT_FLAGS.has(key)) {
      codexArgs.push(key);
      continue;
    }

    const name = key.slice(2);
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Flag ${key} requires a value`);
    }

    flags[name] = value;
    index += 1;
  }

  return { flags, codexArgs };
}

function codexCommandArgs(args) {
  const [subcommand, ...rest] = args;
  if (subcommand === 'resume') {
    return {
      args: ['exec', 'resume', ...withJsonFlag(rest)],
      title: 'Codex resume',
    };
  }

  if (subcommand === 'exec') {
    return {
      args: ['exec', ...withJsonFlag(rest)],
      title: 'Codex exec',
    };
  }

  return {
    args: ['exec', ...withJsonFlag(args)],
    title: 'Codex exec',
  };
}

function withJsonFlag(args) {
  return args.includes('--json') ? args : ['--json', ...args];
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  runCodexCli()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error) => {
      console.error(`${error.message}\n${USAGE}`);
      process.exitCode = 1;
    });
}
