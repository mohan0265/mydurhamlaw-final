// Add missing WebAudio-ish bits for Node/Vitest
;(globalThis as any).AudioBuffer = class {};

if (typeof AbortController === 'undefined') {
  ;(globalThis as any).AbortController = class {
    signal = {} as any
    abort() {}
  };
}
