// Polyfills for browser compatibility
declare global {
  var global: typeof globalThis;
  var process: any;
}

if (typeof global === 'undefined') {
  (window as any).global = globalThis;
}

if (typeof process === 'undefined') {
  (window as any).process = {
    env: {},
    version: '',
    versions: {},
  };
}