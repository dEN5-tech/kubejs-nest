// startup.index.ts - Регистрация контента при старте
// Ультимативное решение для Creative Tab

import "reflect-metadata";
import { NATIVE_REGISTRY } from "./lib/decorators";

// Импортируем классы для предотвращения tree-shaking
import { TDMainTab } from "./modules/clicker/tabs/td-tabs";
import { CoinItem, GridToolItem, WaveSpawnerItem, SpeedPotionItem, BlazeTowerItem } from "./modules/clicker/items/td-items";
import { BasicTowerBlock, IceTowerBlock, FireTowerBlock, GoldMineBlock } from "./modules/clicker/blocks/td-blocks";
import { FediaSkeleton } from "./modules/clicker/entities/fedia-skeleton";
import { BlazeTower } from "./modules/clicker/entities/blaze-tower";

// Список классов, чтобы esbuild принудительно включил их в сборку вместе с декораторами
const _registryClasses = [
  TDMainTab,
  CoinItem, GridToolItem, WaveSpawnerItem, SpeedPotionItem, BlazeTowerItem,
  BasicTowerBlock, IceTowerBlock, FireTowerBlock, GoldMineBlock,
  FediaSkeleton, BlazeTower
];

/**
 * Основная функция регистрации всего контента
 */
export function registerContent(): void {
  console.log('[KJS-STARTUP] Registering content...');

  const registry = NATIVE_REGISTRY;

  // 1. РЕГИСТРАЦИЯ ТАБОВ
  StartupEvents.registry('creative_mode_tab', (event: any) => {
    runRegistry(event, registry, 'creative_mode_tab');
  });

  // 2. РЕГИСТРАЦИЯ БЛОКОВ И ПРЕДМЕТОВ
  StartupEvents.registry('minecraft:block', (event: any) => {
    runRegistry(event, registry, 'minecraft:block');
  });

  StartupEvents.registry('item', (event: any) => {
    runRegistry(event, registry, 'minecraft:item');
  });

  // 2.1 РЕГИСТРАЦИЯ СУЩЕСТВ (EntityJS: type is 2nd arg, NOT chained method)
  StartupEvents.registry('entity_type', (event: any) => {
    const it = registry.entrySet().iterator();
    let count = 0;
    while (it.hasNext()) {
      const entry = it.next();
      const meta = entry.getValue();
      if (meta.get("type") === 'entity') {
        const id = meta.get("id");
        const base = meta.get("base") || 'mob';
        const entityjsType = base.includes(':') ? base : `entityjs:${base}`;
        try {
          const instance = new (entry.getKey())();
          // EntityJS API: event.create(id, 'entityjs:mob') or other registered type
          const builder = event.create(id, entityjsType);
          if (instance.configure) {
            instance.configure(builder);
          }
          console.info(`[KJS-REGISTRY] Registered entity: ${id} with type ${entityjsType}`);
          count++;
        } catch (e) {
          console.error(`[KJS-REGISTRY] Failed to register entity ${id}: ${e}`);
        }
      }
    }
    if (count > 0) {
      console.info(`[KJS-REGISTRY] Total entities registered: ${count}`);
    }
  });

  // 2.2 АТРИБУТЫ СУЩЕСТВ (EntityJS: separate EntityJSEvents.attributes event)
  EntityJSEvents.attributes((event: any) => {
    const it2 = registry.entrySet().iterator();
    while (it2.hasNext()) {
      const entry = it2.next();
      const meta = entry.getValue();
      if (meta.get("type") === 'entity') {
        const id = meta.get("id");
        try {
          const instance = new (entry.getKey())();
          if (instance.attributes) {
            event.modify(id, (attr: any) => {
              instance.attributes(attr);
            });
            console.info(`[KJS-REGISTRY] Applied attributes for: ${id}`);
          }
        } catch (e) {
          console.error(`[KJS-REGISTRY] Failed attributes for ${id}: ${e}`);
        }
      }
    }
  });

  // 3. ПРИНУДИТЕЛЬНОЕ НАПОЛНЕНИЕ ТАБА (Паттерн из MinecraftTD_game_sources)
  StartupEvents.modifyCreativeTab('kubejs:td_main_tab', (event: any) => {
    const it = registry.entrySet().iterator();
    let addedCount = 0;

    while (it.hasNext()) {
      const entry = it.next();
      const meta = entry.getValue();
      const type = meta.get("type");

      if (type === 'minecraft:item' || type === 'minecraft:block') {
        const id = meta.get("registryId");
        const tabId = meta.get("tabId");

        // Добавляем только если это наш таб или предмет без таба
        if (tabId === 'kubejs:td_main_tab' || !tabId) {
          try {
            event.add(id);
            addedCount++;
          } catch (e) {
            console.error(`[KJS-REGISTRY] Failed to add ${id}: ${e}`);
          }
        }
      }
    }

    console.info(`[KJS-REGISTRY] Added ${addedCount} items to kubejs:td_main_tab`);
  });

  console.log('[KJS-STARTUP] Content registration complete');
}

/**
 * Универсальный регистратор для всех типов
 */
function runRegistry(event: any, registry: any, type: string): void {
  const it = registry.entrySet().iterator();
  let count = 0;

  while (it.hasNext()) {
    const entry = it.next();
    const meta = entry.getValue();

    if (meta.get("type") === type) {
      const id = meta.get("registryId");

      try {
        const instance = new (entry.getKey())();
        const builder = event.create(id);

        if (instance.configure) {
          instance.configure(builder);
        }

        const typeName = type.replace('minecraft:', '');
        console.info(`[KJS-REGISTRY] Registered ${typeName}: ${id}`);
        count++;
      } catch (e) {
        console.error(`[KJS-REGISTRY] Failed to register ${id}: ${e}`);
      }
    }
  }

  if (count > 0) {
    console.info(`[KJS-REGISTRY] Total ${type} registered: ${count}`);
  }
}

// Экспортируем
export const KubeStartup = {
  registerContent
};

// Запускаем регистрацию при загрузке скрипта
KubeStartup.registerContent();

console.log(`[KJS-STARTUP] Bundle classes loaded: ${_registryClasses.length}`);
