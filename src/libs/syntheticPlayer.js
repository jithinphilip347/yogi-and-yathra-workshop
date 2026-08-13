/**
 * syntheticPlayer.js
 *
 * Bridges an iframe-based provider (YouTube / Vimeo) into the internal player
 * contract without faking native events. The provider SDK reports REAL state
 * (play/pause/time/duration/ended/error) and this object exposes the subset of
 * the HTMLMediaElement interface the playback controllers read — so the whole
 * existing pipeline (resume, seek, watched-time accounting, progress flush,
 * auto-next) works unchanged for iframe providers.
 *
 * The getters read live state captured from the SDK; the setters/actions call
 * the corresponding SDK methods. It is intentionally NOT a full
 * HTMLMediaElement — just the surface the player actually uses.
 */

export function createSyntheticPlayer(getState, actions = {}) {
  const player = {
    // Marker so providers can clean `videoRef.current` up on unmount.
    _synthetic: true,

    buffered: { length: 0, start: () => 0, end: () => 0 },

    get currentTime() {
      return Number(getState().currentTime) || 0;
    },
    set currentTime(seconds) {
      const next = Math.max(0, Number(seconds) || 0);
      if (typeof actions.seekTo === 'function') actions.seekTo(next);
    },

    get duration() {
      return Number(getState().duration) || 0;
    },

    get paused() {
      return Boolean(getState().paused);
    },

    get playbackRate() {
      return Number(getState().playbackRate) || 1;
    },
    set playbackRate(rate) {
      if (typeof actions.setPlaybackRate === 'function') {
        actions.setPlaybackRate(Number(rate) || 1);
      }
    },

    // Iframe providers never expose native seeking state.
    get seeking() {
      return false;
    },

    get readyState() {
      return typeof actions.readyState === 'function' ? actions.readyState() : 0;
    },

    load() {
      if (typeof actions.load === 'function') actions.load();
    },

    play() {
      if (typeof actions.play === 'function') actions.play();
      return Promise.resolve();
    },

    pause() {
      if (typeof actions.pause === 'function') actions.pause();
    },
  };

  return player;
}
