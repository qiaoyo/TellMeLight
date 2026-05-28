import { ANIMATION, SLOT_COUNT, STATE, STATE_RENDERING } from './states.js';

const FRAME_SIZE = 64;
const SLOT_SIZE = 8;
const SLOT_OFFSET = 8;

const STATE_CODE = Object.freeze({
  [STATE.IDLE]: 0,
  [STATE.RUNNING]: 1,
  [STATE.APPROVAL]: 2,
  [STATE.DONE]: 3,
  [STATE.ERROR]: 4,
});

const ANIMATION_CODE = Object.freeze({
  [ANIMATION.OFF]: 0,
  [ANIMATION.STEADY]: 1,
  [ANIMATION.BREATHE]: 2,
  [ANIMATION.PULSE]: 3,
  [ANIMATION.WARNING]: 4,
});

export function encodeDisplayFrame({ seq = 0, brightness = 255, flags = 0, slots = [] } = {}) {
  const frame = new Uint8Array(FRAME_SIZE);

  frame[0] = 'T'.charCodeAt(0);
  frame[1] = 'L'.charCodeAt(0);
  frame[2] = 1;
  frame[3] = byte(seq);
  frame[4] = byte(brightness);
  frame[5] = byte(flags);
  frame[6] = 0;
  frame[7] = 0;

  for (let index = 0; index < SLOT_COUNT; index += 1) {
    encodeSlot(frame, index, slots[index]);
  }

  frame[63] = crc8(frame.subarray(0, 63));
  return frame;
}

function encodeSlot(frame, index, slot) {
  const offset = SLOT_OFFSET + index * SLOT_SIZE;
  const hasKnownState = Object.hasOwn(STATE_CODE, slot?.state);
  const state = hasKnownState ? slot.state : STATE.IDLE;
  const rendering = STATE_RENDERING[state] ?? STATE_RENDERING[STATE.IDLE];
  const animation = hasKnownState ? slot.anim ?? rendering.animation : rendering.animation;
  const intensity = hasKnownState ? slot.intensity ?? rendering.intensity : rendering.intensity;

  frame[offset] = STATE_CODE[state];
  frame[offset + 1] = ANIMATION_CODE[animation] ?? ANIMATION_CODE[rendering.animation];
  frame[offset + 2] = byte(intensity);
  frame[offset + 3] = byte(hasKnownState ? slot.age ?? 0 : 0);

  const sessionId = slot?.sessionId;
  const hash = typeof sessionId === 'string' && sessionId.length > 0 ? labelHash(sessionId) : 0;
  frame[offset + 4] = hash & 0xff;
  frame[offset + 5] = (hash >> 8) & 0xff;
  frame[offset + 6] = 0;
  frame[offset + 7] = 0;
}

function byte(value) {
  const number = Number.isFinite(value) ? Math.round(value) : 0;
  return Math.max(0, Math.min(255, number));
}

function labelHash(value) {
  let hash = 5381;
  for (const character of value) {
    hash = ((hash << 5) + hash + character.charCodeAt(0)) & 0xffff;
  }
  return hash;
}

function crc8(bytes) {
  let crc = 0x5a;
  for (const byteValue of bytes) {
    crc ^= byteValue;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
  }
  return crc;
}
