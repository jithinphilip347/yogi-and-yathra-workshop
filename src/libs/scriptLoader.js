/**
 * scriptLoader.js
 *
 * Minimal external-script loader used by the provider SDKs (YouTube IFrame
 * API, Vimeo player SDK). Deduplicates by src so the same SDK is never
 * injected twice, and resolves the load promise once the script is ready.
 */

const loadedScripts = new Set();

export function loadScriptOnce(src) {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Cannot load script outside the browser: ' + src));
  }

  if (loadedScripts.has(src) || document.querySelector(`script[data-sdk-src="${src}"]`)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.sdkSrc = src;
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load script: ' + src));
    };
    document.head.appendChild(script);
  });
}
