// startup.index.ts - Регистрация контента при старте
// Ультимативное решение для Creative Tab

import "reflect-metadata";
import { NATIVE_REGISTRY } from "./lib/decorators";

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
