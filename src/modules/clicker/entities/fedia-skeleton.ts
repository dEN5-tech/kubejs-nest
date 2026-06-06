import { EntityRegistry, OnEvent } from "../../../lib/decorators";
import type { KjsEvent } from "../../../lib/decorators";

/**
 * Fedia - Кастомный скелет с уникальным поведением
 */
@EntityRegistry('minecraft_td:fedia_skeleton', 'mob')
export class FediaSkeleton {
  
  /**
   * Конфигурация внешнего вида (Startup - EntityJS builder API)
   */
  configure(builder: any): void {
    builder
      .sized(0.7, 2.1)
      .clientTrackingRange(12)
      .eggItem((egg: any) => {
        egg.backgroundColor(0x4A4A4A);
        egg.highlightColor(0xFFFFFF);
      })
      .modelResource((entity: any) => "kubejs:geo/entity/sasuke.geo.json")
      .textureResource((entity: any) => "kubejs:textures/entity/sasuke.png")
      .animationResource((entity: any) => "kubejs:animations/entity/sasuke.animation.json")
      .displayName("§eФедя");
  }

  /**
   * Настройка характеристик (EntityJS builder .attributes() callback)
   */
  attributes(map: any): void {
    map.add('minecraft:generic.max_health', 50);
    map.add('minecraft:generic.attack_damage', 8);
    map.add('minecraft:generic.movement_speed', 0.25);
    map.add('minecraft:generic.follow_range', 20);
  }

  /**
   * При получении урона - кричит
   */
  @OnEvent(EntityEvents, 'hurt', 'minecraft_td:fedia_skeleton')
  onHurt(event: KjsEvent<typeof EntityEvents, 'hurt'>): void {
    const entity = event.entity;
    console.info(`[FEDIA] Hurt event fired for: ${entity} (type: ${entity.type}, type.class: ${entity.type ? (entity.type as any).getClass() : 'null'})`);
    
    // Случайная фраза при ранении
    const phrases = [
      "§cФедя: Ай! Больно же!",
      "§cФедя: За что?!",
      "§cФедя: Осторожнее!",
      "§cФедя: Не надо меня бить!"
    ];
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    
    // Показываем сообщение nearby игрокам
    const players = (event.level as any).players;
    for (let i = 0; i < players.size(); i++) {
      const player = players.get(i);
      const distance = Math.sqrt(
        Math.pow(player.x - entity.x, 2) + 
        Math.pow(player.y - entity.y, 2) + 
        Math.pow(player.z - entity.z, 2)
      );
      if (distance < 20) {
        player.tell(randomPhrase);
      }
    }
  }

  /**
   * При смерти - особое сообщение
   */
  @OnEvent(EntityEvents, 'death', 'minecraft_td:fedia_skeleton')
  onDeath(event: KjsEvent<typeof EntityEvents, 'death'>): void {
    console.info(`[FEDIA] Death event fired`);
    const players = (event.level as any).players;
    for (let i = 0; i < players.size(); i++) {
      players.get(i).tell("§6💀 Федя пал в бою! Скоро вернётся...");
    }
  }
}