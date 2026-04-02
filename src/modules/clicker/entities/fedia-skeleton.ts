import { EntityRegistry, OnEvent } from "../../../lib/decorators";

/**
 * Fedia - Кастомный скелет с уникальным поведением
 */
@EntityRegistry('minecraft_td:fedia_skeleton', 'mob')
export class FediaSkeleton {
  
  /**
   * Конфигурация внешнего вида (Startup)
   */
  configure(builder: any): void {
    builder.sized(0.7, 2.1)
      .clientTrackingRange(12)
      .spawnEgg(0x4A4A4A, 0xFFFFFF) // Тёмно-серый с белым
      .displayName("§eФедя");
  }

  /**
   * Настройка характеристик (Startup)
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
  @OnEvent(EntityEvents, 'hurt')
  onHurt(event: any): void {
    const entity = event.entity;
    if (entity.type === 'minecraft_td:fedia_skeleton') {
      // Случайная фраза при ранении
      const phrases = [
        "§cФедя: Ай! Больно же!",
        "§cФедя: За что?!",
        "§cФедя: Осторожнее!",
        "§cФедя: Не надо меня бить!"
      ];
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      
      // Показываем сообщение nearby игрокам
      const players = event.level.players;
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
  }

  /**
   * При смерти - особое сообщение
   */
  @OnEvent(EntityEvents, 'death')
  onDeath(event: any): void {
    if (event.entity.type === 'minecraft_td:fedia_skeleton') {
      const players = event.level.players;
      for (let i = 0; i < players.size(); i++) {
        players.get(i).tell("§6💀 Федя пал в бою! Скоро вернётся...");
      }
    }
  }
}