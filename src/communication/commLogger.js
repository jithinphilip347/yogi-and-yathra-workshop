/**
 * Communication Debug Logger
 * All logs are disabled in production (process.env.NODE_ENV !== 'development')
 */

const IS_DEV = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'development'
  : true;

const COLORS = {
  CONNECT:        '#22c55e',
  SUBSCRIBE:      '#3b82f6',
  LEAVE:          '#f59e0b',
  EVENT_RECEIVED: '#8b5cf6',
  DISPATCH:       '#06b6d4',
  DEDUPLICATE:    '#64748b',
  OPTIMISTIC_ADD: '#f97316',
  OPTIMISTIC_CONFIRM: '#22c55e',
  OPTIMISTIC_ROLLBACK: '#ef4444',
  RECONNECT:      '#eab308',
  ERROR:          '#ef4444',
  STATE_UPDATE:   '#10b981',
};

export const commLog = (event, data = null) => {
  if (!IS_DEV) return;
  const color = COLORS[event] || '#94a3b8';
  const label = `%c[COMM:${event}]`;
  const style = `color: ${color}; font-weight: bold; font-size: 11px;`;
  if (data !== null) {
    console.log(label, style, data);
  } else {
    console.log(label, style);
  }
};

export default commLog;
