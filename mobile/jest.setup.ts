const nonConfigurableGlobals: string[] = [
  '__ExpoImportMetaRegistry',
  'structuredClone',
  'TextDecoderStream',
  'TextEncoderStream',
];

for (const name of nonConfigurableGlobals) {
  if (!(name in globalThis)) {
    Object.defineProperty(globalThis, name, {
      value: {},
      configurable: false,
      writable: true,
      enumerable: false,
    });
  } else {
    const desc = Object.getOwnPropertyDescriptor(globalThis, name);
    if (desc && desc.configurable) {
      Object.defineProperty(globalThis, name, {
        value: desc.value ?? {},
        configurable: false,
        writable: desc.writable ?? true,
        enumerable: desc.enumerable ?? false,
      });
    }
  }
}
