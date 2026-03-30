import { container } from "tsyringe";
import { MODULE_METADATA, EVENT_METADATA } from "./decorators";

export class KubeFactory {
  private static readonly bootstrappedModules = new Set<any>();

  static create(rootModule: any): void {
    const start = Date.now();
    this.bootstrapModule(rootModule);
    console.log(`[KJS-NEST] System ready in ${Date.now() - start}ms`);
  }

  private static bootstrapModule(moduleClass: any): void {
    if (this.bootstrappedModules.has(moduleClass)) return;
    this.bootstrappedModules.add(moduleClass);

    const metadata = Reflect.getMetadata(MODULE_METADATA, moduleClass);
    if (!metadata) return;

    // 1. Providers - use forEach to avoid _loop issues
    if (metadata.providers) {
      metadata.providers.forEach((provider: any) => {
        container.resolve(provider);
      });
    }

    // 2. Controllers - use forEach
    if (metadata.controllers) {
      metadata.controllers.forEach((controllerClass: any) => {
        const instance = container.resolve(controllerClass);
        const events = Reflect.getOwnMetadata(EVENT_METADATA, controllerClass);

        if (events) {
          events.forEach((event: any) => {
            if (typeof instance[event.propertyKey] !== 'function') return;

            const handler = (e: any) => instance[event.propertyKey](e);

            try {
              if (event.extra !== undefined) {
                console.log(`[KJS-NEST] Binding ${event.methodName}(${event.extra}) -> ${event.propertyKey}`);
                event.host[event.methodName](event.extra, handler);
              } else {
                console.log(`[KJS-NEST] Binding ${event.methodName} -> ${event.propertyKey}`);
                event.host[event.methodName](handler);
              }
            } catch (err) {
              console.error(`[KJS-NEST] Failed to bind ${event.methodName}: ${err}`);
            }
          });
        }
      });
    }

    // 3. Imports - use forEach
    if (metadata.imports) {
      metadata.imports.forEach((m: any) => {
        this.bootstrapModule(m);
      });
    }
  }
}
