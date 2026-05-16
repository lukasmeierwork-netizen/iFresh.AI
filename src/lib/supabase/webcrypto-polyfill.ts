import { sha256 } from '@noble/hashes/sha2.js';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function toUint8Array(data: ArrayBuffer | ArrayBufferView) {
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}

/**
 * `crypto.getRandomValues` (RN) + `subtle.digest('SHA-256', …)` for Supabase PKCE (S256).
 * In Expo **Go** we cannot load `react-native-quick-crypto` (it throws on import), so this
 * pure-JS + ExpoCrypto path is used instead. Dev / release builds with native code use
 * `react-native-quick-crypto` for the same effect.
 */
function installExpoGoWebCrypto() {
  // Must run first: sets `global.crypto.getRandomValues` (uses Expo Crypto in the Go client).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-get-random-values');

  const c = globalThis.crypto;
  if (c && typeof c.subtle !== 'undefined' && typeof c.subtle.digest === 'function') {
    return;
  }

  if (!c) {
    return;
  }

  const subtle: Pick<SubtleCrypto, 'digest'> = {
    async digest(algorithm, data) {
      const name = typeof algorithm === 'string' ? algorithm : (algorithm as Algorithm).name;
      if (name !== 'SHA-256') {
        throw new DOMException('Unsupported digest algorithm', 'NotSupportedError');
      }
      const out = sha256(toUint8Array(data));
      return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
    },
  };

  Object.defineProperty(c, 'subtle', {
    value: subtle,
    configurable: true,
    writable: true,
  });
}

if (isExpoGo) {
  installExpoGoWebCrypto();
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { install } = require('react-native-quick-crypto') as { install: () => void };
  install();
}
