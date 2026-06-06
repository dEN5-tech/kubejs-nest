import { EntityController, OnEvent } from "../../../lib/decorators";
import type { KjsEvent } from "../../../lib/decorators";

/**
 * TitanZombieBehavior - управляет зомби с тегом 'td_boss'
 * Берет ванильного зомби и делает из него босса
 */
@EntityController('minecraft:zombie')
export class TitanZombieBehavior {
  
  /**
   * Вызывается при спавне зомби
   */
  @OnEvent(EntityEvents, 'spawned')
  onSpawn(event: KjsEvent<typeof EntityEvents, 'spawned'>): void {
    const { entity } = event;
    
    // Проверяем тег
    if (entity.tags && entity.tags.contains('td_boss')) {
      // Устанавливаем HP
      (entity as any).maxHealth = 500;
      (entity as any).health = 500;
      
      // Кастомное имя
      (entity as any).customName = "§c§lТИТАН-ЗОМБИ§r";
      entity.setSilent(true);
      
      console.log('[TD] Titan Zombie spawned!');
    }
  }

  /**
   * Вызывается при получении урона
   */
  @OnEvent(EntityEvents, 'hurt')
  onHurt(event: KjsEvent<typeof EntityEvents, 'hurt'>): void {
    const { entity, source } = event;
    
    if (entity.tags && entity.tags.contains('td_boss')) {
      // Звук при ударе
      (entity.level as any).playSound(
        'minecraft:entity.zombie.attack_iron_door', 
        entity.x, entity.y, entity.z, 
        1.0, 0.8
      );
      
      // Эффект пламени
      (entity.level as any).spawnParticles(
        'minecraft:flame', true, 
        entity.x, entity.y + 1, entity.z, 
        0.3, 0.5, 0.3, 5, 0.05
      );
    }
  }

  /**
   * Вызывается при смерти
   */
  @OnEvent(EntityEvents, 'death')
  onDeath(event: KjsEvent<typeof EntityEvents, 'death'>): void {
    const { entity, source } = event;
    
    if (entity.tags && entity.tags.contains('td_boss')) {
      const player = source.player;
      
      if (player) {
        (player as any).tell("§6§lВы повергли ТИТАНА!§r");
        (player as any).tell("§eНаграда: §a1000 золота");
        
        // Спавн мини-зомби при смерти
        for (let i = 0; i < 3; i++) {
          const x = entity.x + (Math.random() * 4 - 2);
          const y = entity.y;
          const z = entity.z + (Math.random() * 4 - 2);
          (entity.level as any).spawnMob('minecraft:zombie', { x, y, z });
        }
      }
    }
  }
}