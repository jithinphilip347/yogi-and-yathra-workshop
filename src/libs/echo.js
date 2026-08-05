import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

if (typeof window !== 'undefined') {
  window.Pusher = Pusher;
}

let echoInstance = null;

export const getEcho = (token = null) => {
  if (typeof window === 'undefined') return null;

  if (!echoInstance && (token || localStorage.getItem('token'))) {
    const authToken = token || localStorage.getItem('token');
    const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'localhost';

    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'lms-reverb-key',
      wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || apiHost,
      wsPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
      wssPort: process.env.NEXT_PUBLIC_REVERB_PORT || 8080,
      forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${authToken}`,
          Accept: 'application/json',
        },
      },
    });
  }

  return echoInstance;
};

export const subscribeToCourseChannel = (courseId, callbacks = {}) => {
  const echo = getEcho();
  if (!echo) return null;

  const channel = echo.private(`course.${courseId}`);

  if (callbacks.onMessageCreated) channel.listen('.message.created', callbacks.onMessageCreated);
  if (callbacks.onMessageUpdated) channel.listen('.message.updated', callbacks.onMessageUpdated);
  if (callbacks.onMessageDeleted) channel.listen('.message.deleted', callbacks.onMessageDeleted);
  if (callbacks.onThreadStatusUpdated) channel.listen('.thread.status_updated', callbacks.onThreadStatusUpdated);
  if (callbacks.onReactionUpdated) channel.listen('.reaction.updated', callbacks.onReactionUpdated);

  return channel;
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
