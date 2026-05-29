import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

test('simulator html loads app and stylesheet', async () => {
  const html = await readFile('simulator/index.html', 'utf8');

  assert.match(html, /TellMeLight Simulator/);
  assert.match(html, /styles\.css/);
  assert.match(html, /app\.js/);
});

test('simulator app defines six FIFO slots', async () => {
  const app = await readFile('simulator/app.js', 'utf8');

  assert.match(app, /const SLOT_COUNT = 6/);
  assert.match(app, /session-1/);
  assert.match(app, /session-6/);
});

test('simulator styles preserve four-bar physical language', async () => {
  const css = await readFile('simulator/styles.css', 'utf8');

  assert.match(css, /\.device-face/);
  assert.match(css, /\.bar-left-long/);
  assert.match(css, /\.bar-right-long/);
  assert.match(css, /\.bar-middle-low/);
  assert.match(css, /\.bar-middle-high/);
});

test('simulator styles keep the core display near-square with slanted strips', async () => {
  const css = await readFile('simulator/styles.css', 'utf8');

  assert.match(css, /aspect-ratio:\s*1\s*\/\s*1/);
  assert.match(css, /clip-path:\s*polygon/);
  assert.match(css, /border-radius:\s*12px/);
});

test('simulator applies state changes to the selected slot', async () => {
  const simulator = await runSimulator();

  simulator.clickAction('add-running');
  simulator.clickSlot(4);
  simulator.clickAction('done');

  assert.equal(simulator.slotState(4), 'done');
  assert.equal(simulator.slotState(5), 'running');
  assert.equal(simulator.slotSelected(4), 'true');

  simulator.clickSlot(5);
  simulator.clickAction('error');

  assert.equal(simulator.slotState(4), 'done');
  assert.equal(simulator.slotState(5), 'error');
  assert.equal(simulator.slotSelected(5), 'true');
});

test('simulator clears the selected slot and compacts left', async () => {
  const simulator = await runSimulator();

  simulator.clickAction('add-running');
  simulator.clickSlot(4);
  simulator.clickAction('clear-selected');

  assert.equal(simulator.slotSessionId(4), 'session-2');
  assert.equal(simulator.slotState(4), 'running');
  assert.equal(simulator.slotSessionId(5), '');
  assert.equal(simulator.slotState(5), 'idle');
});

test('simulator supports keyboard selection for focusable slots', async () => {
  const simulator = await runSimulator();

  simulator.clickAction('add-running');
  simulator.keySlot(4, 'Enter');
  simulator.clickAction('approval');

  assert.equal(simulator.slotState(4), 'approval');
  assert.equal(simulator.slotSelected(4), 'true');

  simulator.keySlot(5, ' ');
  simulator.clickAction('done');

  assert.equal(simulator.slotState(4), 'approval');
  assert.equal(simulator.slotState(5), 'done');
  assert.equal(simulator.slotSelected(5), 'true');
});

async function runSimulator() {
  const app = await readFile('simulator/app.js', 'utf8');
  const slots = Array.from({ length: 6 }, (_, index) => createElement({ slot: String(index) }));
  const actions = Object.fromEntries(
    ['add-running', 'running', 'approval', 'done', 'error', 'clear-selected'].map((action) => [
      action,
      createElement({ action }),
    ]),
  );
  const slotJson = createElement();
  let clickHandler = null;
  let keydownHandler = null;

  const document = {
    addEventListener(type, handler) {
      if (type === 'click') {
        clickHandler = handler;
      }
      if (type === 'keydown') {
        keydownHandler = handler;
      }
    },
    querySelector(selector) {
      if (selector === '#slot-json') return slotJson;

      const slotMatch = selector.match(/^\[data-slot="(\d+)"\]$/);
      if (slotMatch) return slots[Number(slotMatch[1])];

      const actionMatch = selector.match(/^\[data-action="([^"]+)"\]$/);
      if (actionMatch) return actions[actionMatch[1]];

      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-slot]') return slots;
      return [];
    },
  };

  vm.runInNewContext(app, { document, JSON, Array, Object, String, Number }, { filename: 'simulator/app.js' });

  return {
    clickAction(action) {
      clickHandler({ target: actions[action] });
    },
    clickSlot(index) {
      clickHandler({ target: slots[index] });
    },
    keySlot(index, key) {
      if (!keydownHandler) {
        throw new Error('No keydown handler registered');
      }
      keydownHandler({
        target: slots[index],
        key,
        preventDefault() {},
      });
    },
    slotSelected(index) {
      return slots[index].dataset.selected;
    },
    slotSessionId(index) {
      return slots[index].dataset.sessionId;
    },
    slotState(index) {
      return slots[index].dataset.state;
    },
  };
}

function createElement(dataset = {}) {
  return {
    className: '',
    dataset,
    textContent: '',
    setAttribute(name, value) {
      this[name] = value;
    },
    closest(selector) {
      if (selector === '[data-action]' && this.dataset.action) return this;
      if (selector === '[data-slot]' && this.dataset.slot) return this;
      return null;
    },
  };
}
