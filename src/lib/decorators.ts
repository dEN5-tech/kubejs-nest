import "reflect-metadata";
import { singleton } from "tsyringe";

// --- JAVA BACKEND ДЛЯ МЕТАДАННЫХ ---
const FastObjectMap = Java.loadClass('it.unimi.dsi.fastutil.objects.Object2ObjectOpenHashMap');
const JavaList = Java.loadClass('java.util.ArrayList');

/**
 * Глобальный нативный реестр метаданных.
 * Привязан к global, чтобы быть видимым во всех контекстах (Startup, Server, Client)
 */
if (typeof global !== 'undefined' && !global['__NATIVE_REGISTRY__']) {
  global['__NATIVE_REGISTRY__'] = new FastObjectMap();
}
export const NATIVE_REGISTRY = global['__NATIVE_REGISTRY__'];

function setNativeMeta(target: any, key: string, value: any) {
    let meta = NATIVE_REGISTRY.get(target);
    if (!meta) {
        meta = new FastObjectMap();
        NATIVE_REGISTRY.put(target, meta);
    }
    meta.put(key, value);
}

export const Injectable = singleton;

// ==================== MODULE SYSTEM ====================

export function Module(metadata: {
  controllers: any[];
  providers: any[];
  imports?: any[];
}) {
  return (target: any) => {
    setNativeMeta(target, "type", "module");
    setNativeMeta(target, "config", metadata);
    return singleton()(target);
  };
}

export function Controller() {
  return (target: any) => {
    setNativeMeta(target, "type", "controller");
    return singleton()(target);
  };
}

// ==================== EVENTS ====================

export function OnEvent(host: any, methodName: string, extra?: any) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;
    
    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
        classMeta = new FastObjectMap();
        NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let events = classMeta.get("events");
    if (!events) {
        events = new JavaList();
        classMeta.put("events", events);
    }
    
    events.add({ host, methodName, propertyKey, extra });
  };
}

export const SubscribeEvent = OnEvent;

// ==================== TICK ====================

export function Tick(interval: number = 1) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let tickTasks = classMeta.get("tickTasks");
    if (!tickTasks) {
      tickTasks = new JavaList();
      classMeta.put("tickTasks", tickTasks);
    }

    tickTasks.add({ propertyKey, interval });
  };
}

// ==================== NBT ====================

export function NbtField(type: 'int' | 'double' | 'string' | 'boolean' | 'long' | 'uuid' = 'double') {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let nbtFields = classMeta.get("nbtFields");
    if (!nbtFields) {
      nbtFields = new FastObjectMap();
      classMeta.put("nbtFields", nbtFields);
    }

    nbtFields.put(propertyKey, type);
  };
}

export function PersistentState(nbtKey: string) {
  return (target: any) => {
    setNativeMeta(target, "nbtKey", nbtKey);
  };
}

// ==================== NETWORK ====================

export function OnPacket(channel: string) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let packets = classMeta.get("packets");
    if (!packets) {
      packets = new JavaList();
      classMeta.put("packets", packets);
    }

    packets.add({ channel, propertyKey });
  };
}

// ==================== COMMANDS ====================

export function Command(name: string) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let commands = classMeta.get("commands");
    if (!commands) {
      commands = new JavaList();
      classMeta.put("commands", commands);
    }

    commands.add({ name, propertyKey });
  };
}

// ==================== PAINT ====================

export function Paint(elementId: string) {
  return (target: any, propertyKey: string) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    let paints = classMeta.get("paints");
    if (!paints) {
      paints = new JavaList();
      classMeta.put("paints", paints);
    }

    paints.add({ elementId, propertyKey });
  };
}

/**
 * Декоратор для регистрации кастомного блока.
 * @param id - ID блока (например, 'td:basic_tower')
 * @param tabId - ID креативной вкладки (опционально)
 */
export function BlockRegistry(id: string, tabId?: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "minecraft:block");
    classMeta.put("registryId", id);
    if (tabId) {
      classMeta.put("tabId", tabId);
    }
  };
}

// ==================== REGISTRY: ITEMS ====================

/**
 * Декоратор для регистрации кастомного предмета.
 * @param id - ID предмета (например, 'td:coin')
 * @param tabId - ID креативной вкладки (опционально)
 */
export function ItemRegistry(id: string, tabId?: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "minecraft:item");
    classMeta.put("registryId", id);
    if (tabId) {
      classMeta.put("tabId", tabId);
    }
  };
}

// ==================== REGISTRY: MOB EFFECTS ====================

export function MobEffectRegistry(id: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "mob_effect");
    classMeta.put("registryId", id);
  };
}

// ==================== REGISTRY: ENCHANTMENTS ====================

export function EnchantmentRegistry(id: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "minecraft:enchantment");
    classMeta.put("registryId", id);
  };
}

// ==================== REGISTRY: CREATIVE TAB ====================

export function CreativeTab(id: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "creative_mode_tab");
    classMeta.put("registryId", id);
  };
}

// ==================== ENTITY CONTROLLER ====================

export function EntityController(entityId: string) {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "entity_controller");
    classMeta.put("targetId", entityId);
  };
}

// ==================== ENTITY REGISTRY ====================

export function EntityRegistry(id: string, type: 'mob' | 'living' | 'base' = 'mob') {
  return (target: any) => {
    const constructor = target.constructor;

    let classMeta = NATIVE_REGISTRY.get(constructor);
    if (!classMeta) {
      classMeta = new FastObjectMap();
      NATIVE_REGISTRY.put(constructor, classMeta);
    }

    classMeta.put("type", "entity");
    classMeta.put("id", id);
    classMeta.put("base", type);
  };
}
