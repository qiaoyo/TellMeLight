import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('hardware architecture note records selected rev A parts', async () => {
  const note = await readFile('hardware/notes/rev-a-architecture.md', 'utf8');

  assert.match(note, /USB-C/);
  assert.match(note, /RP2040-class/);
  assert.match(note, /LP5024-class/);
  assert.match(note, /six RGB light zones/);
});

test('local simulation decision prevents early PCB layout', async () => {
  const decision = await readFile('docs/decisions/0001-local-simulation-first.md', 'utf8');

  assert.match(decision, /Accepted/);
  assert.match(decision, /No PCB layout/);
  assert.match(decision, /FIFO/);
  assert.match(decision, /simulator/);
});

test('adapter contract documents normalized event fields and commands', async () => {
  const contract = await readFile('docs/adapters/contract.md', 'utf8');

  assert.match(contract, /session_id/);
  assert.match(contract, /source/);
  assert.match(contract, /started/);
  assert.match(contract, /state_changed/);
  assert.match(contract, /ended/);
  assert.match(contract, /cleared/);
  assert.match(contract, /event-cli\.js started/);
  assert.match(contract, /process-cli\.js/);
  assert.match(contract, /tml-run/);
  assert.match(contract, /--source/);
  assert.match(contract, /--id/);
  assert.match(contract, /--/);
});

test('process wrapper docs avoid PowerShell script separator ambiguity', async () => {
  const contract = await readFile('docs/adapters/contract.md', 'utf8');
  const readme = await readFile('README.md', 'utf8');

  assert.doesNotMatch(contract, /tools\/run-node\.ps1 host\/src\/process-cli\.js/);
  assert.doesNotMatch(readme, /tools\/run-node\.ps1 host\/src\/process-cli\.js/);
});
