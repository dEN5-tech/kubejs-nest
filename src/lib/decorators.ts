import "reflect-metadata";
import { singleton } from "tsyringe";

export const MODULE_METADATA = "nest:module";
export const EVENT_METADATA = "nest:event";

// NestJS-style Injectable using tsyringe's singleton
export const Injectable = singleton;

// Module decorator
export function Module(metadata: {
  controllers: any[];
  providers: any[];
  imports?: any[];
}) {
  return (target: any) => {
    Reflect.defineMetadata(MODULE_METADATA, metadata, target);
    return singleton()(target);
  };
}

// Controller decorator
export function Controller() {
  return (target: any) => {
    return singleton()(target);
  };
}

// Universal event decorator (like @OnEvent in NestJS)
export function OnEvent(host: any, methodName: string, extra?: any) {
  return (target: any, propertyKey: string) => {
    const events = Reflect.getOwnMetadata(EVENT_METADATA, target.constructor) || [];
    events.push({ host, methodName, propertyKey, extra });
    Reflect.defineMetadata(EVENT_METADATA, events, target.constructor);
  };
}

// Backward compatibility aliases
export const SubscribeEvent = OnEvent;
export const SubscribeEventWithExtra = OnEvent;
