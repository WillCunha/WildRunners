type CleanupCallback = (heldValue: unknown) => void;

if (
    typeof (globalThis as any).FinalizationRegistry ===
    'undefined'
) {
    class FinalizationRegistryPolyfill {
        constructor(
            _cleanupCallback: CleanupCallback,
        ) {}

        register(
            _target: object,
            _heldValue: unknown,
            _unregisterToken?: object,
        ) {
            // Hermes desta versão não possui finalização por GC.
            // Compatibilidade para bibliotecas que esperam a API.
        }

        unregister(
            _unregisterToken: object,
        ) {
            return false;
        }
    }

    (globalThis as any).FinalizationRegistry =
        FinalizationRegistryPolyfill;

    console.log(
        '[WILD POLYFILL] ✅ FinalizationRegistry instalado',
    );
}