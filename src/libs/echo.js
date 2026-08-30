import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

let echoInstance = null;

/**
 * Reads the Sanctum bearer token from Redux Persist storage.
 * redux-persist stores the full root state under the key "persist:root".
 * The auth slice stores: { auth: { token: "...", user: {...} } }
 */
function getTokenFromStorage() {
  try {
    const raw = localStorage.getItem('persist:root');
    if (!raw) return null;
    const root = JSON.parse(raw);
    const auth = root.auth ? JSON.parse(root.auth) : null;
    return auth?.token ?? null;
  } catch {
    return null;
  }
}

/**
 * getEcho — returns the singleton Laravel Echo instance.
 *
 * IMPORTANT: This function is only for use by commEventBus.js.
 * React components must NEVER import or call this directly.
 * All WebSocket subscriptions must go through the Communication Event Bus.
 */
export const getEcho = (explicitToken = null) => {
  if (typeof window === 'undefined') return null;

  const authToken = explicitToken || getTokenFromStorage();

  // If we have a new explicit token and instance exists with old token, reset
  if (echoInstance && explicitToken && echoInstance._authToken !== explicitToken) {
    echoInstance.disconnect();
    echoInstance = null;
  }

  if (!echoInstance && authToken) {
    const apiHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost';

    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'lms-reverb-key',
      wsHost: apiHost,
      wsPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080', 10),
      wssPort: parseInt(process.env.NEXT_PUBLIC_REVERB_PORT || '8080', 10),
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      },
    });

    // Tag the instance with its token for change detection
    echoInstance._authToken = authToken;
  }

  return echoInstance;
};

export const subscribeToLiveSessionPresence = (sessionId, callbacks = {}) => {
  const echo = getEcho();
  if (!echo) return null;

  const channel = echo.join(`live-session.${sessionId}`);

  if (callbacks.onHere) channel.here(callbacks.onHere);
  if (callbacks.onJoining) channel.joining(callbacks.onJoining);
  if (callbacks.onLeaving) channel.leaving(callbacks.onLeaving);
  if (callbacks.onTyping) channel.listen('.user.typing', callbacks.onTyping);

  return channel;
};

export default getEcho;
