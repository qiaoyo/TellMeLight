export function createCodexEventContext({ sessionId, source = 'codex', title } = {}) {
  return {
    ended: false,
    sessionId,
    source,
    title,
  };
}

export function mapCodexEventToTellMeLight(event, context) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  if (event.type === 'thread.started' && event.thread_id) {
    context.sessionId = event.thread_id;
    return {
      source: context.source,
      session_id: context.sessionId,
      event: 'started',
      state: 'running',
      ...(context.title ? { title: context.title } : {}),
    };
  }

  if (!context.sessionId) {
    return null;
  }

  if (isApprovalEvent(event)) {
    return statePayload(context, 'approval');
  }

  if (event.type === 'turn.started') {
    return statePayload(context, 'running');
  }

  if (event.type === 'turn.completed') {
    context.ended = true;
    return endedPayload(context, 'success');
  }

  if (isErrorEvent(event)) {
    context.ended = true;
    return endedPayload(context, 'error');
  }

  return null;
}

export function fallbackCodexStartedPayload(context) {
  if (!context.sessionId) {
    context.sessionId = `codex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return {
    source: context.source,
    session_id: context.sessionId,
    event: 'started',
    state: 'running',
    ...(context.title ? { title: context.title } : {}),
  };
}

export function codexEndedPayload(context, outcome) {
  context.ended = true;
  return endedPayload(context, outcome);
}

function statePayload(context, state) {
  return {
    source: context.source,
    session_id: context.sessionId,
    event: 'state_changed',
    state,
    ...(context.title ? { title: context.title } : {}),
  };
}

function endedPayload(context, outcome) {
  return {
    source: context.source,
    session_id: context.sessionId,
    event: 'ended',
    outcome,
    ...(context.title ? { title: context.title } : {}),
  };
}

function isApprovalEvent(event) {
  return hasApprovalMarker(event.type) || hasApprovalMarker(event.status) || hasApprovalMarker(event.item?.type) || hasApprovalMarker(event.item?.status);
}

function isErrorEvent(event) {
  return hasErrorMarker(event.type) || hasErrorMarker(event.status) || hasErrorMarker(event.item?.status);
}

function hasApprovalMarker(value) {
  const text = String(value ?? '').toLowerCase();
  return text.includes('approval') || text.includes('waiting_for_approval') || text.includes('requires_approval');
}

function hasErrorMarker(value) {
  const text = String(value ?? '').toLowerCase();
  return text.includes('failed') || text.includes('error');
}
