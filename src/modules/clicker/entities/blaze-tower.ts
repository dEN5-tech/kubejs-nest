import { EntityRegistry, Tick } from "../../../lib/decorators";

/**
 * BlazeTower - Огненная башня (сущность на основе ванильного блейза)
 */
@EntityRegistry('minecraft_td:blaze_tower', 'minecraft:blaze')
export class BlazeTower {
  
  /**
   * Настройка EntityJS
   */
  configure(builder: any): void {
    builder
      .eggItem((egg: any) => {
        egg.backgroundColor(0xE69138);
        egg.highlightColor(0xF1C232);
      })
      .modelResource((entity: any) => "kubejs:geo/entity/blaze_tower.geo.json")
      .textureResource((entity: any) => "kubejs:textures/entity/blaze_tower.png")
      .animationResource((entity: any) => "kubejs:animations/entity/blaze_tower.animation.json")
      .addAnimationController('idle_controller', 10, (event: any) => {
        event.thenLoop("animation.blaze_tower.idle");
        return true;
      })
      .displayName("§6Огненная Башня");
  }

  /**
   * Характеристики
   */
  attributes(map: any): void {
    map.add('minecraft:generic.max_health', 100);
    map.add('minecraft:generic.movement_speed', 0.0); // Не двигается
  }

  /**
   * Каждую секунду башни стреляют по врагам
   */
  @Tick(20)
  onTick(event: any): void {
    const level = event.server.overworld;
    const entities = (level as any).entities;
    if (!entities) return;

    const towers: any[] = [];
    const size = entities.size();
    
    // Находим все башни
    for (let i = 0; i < size; i++) {
      const ent = entities.get(i);
      if (ent && String(ent.type) === 'entity.minecraft_td.blaze_tower') {
        towers.push(ent);
      }
    }

    if (towers.length === 0) return;

    // Для каждой башни ищем ближайшего врага
    for (const t of towers) {
      let nearestTarget: any = null;
      let minDist = 15.0; // Дальность атаки
      
      for (let i = 0; i < size; i++) {
        const ent = entities.get(i);
        if (!ent) continue;
        const typeStr = String(ent.type);
        if (typeStr === 'entity.minecraft.zombie' || 
            typeStr === 'entity.minecraft.skeleton' || 
            typeStr === 'entity.minecraft.creeper' ||
            typeStr === 'entity.minecraft_td.fedia_skeleton') { // Также стреляем по Феде
            
          const dist = Math.sqrt(
            Math.pow(ent.x - t.x, 2) + 
            Math.pow(ent.y - t.y, 2) + 
            Math.pow(ent.z - t.z, 2)
          );
          
          if (dist < minDist) {
            minDist = dist;
            nearestTarget = ent;
          }
        }
      }

      // Если нашли цель - стреляем!
      if (nearestTarget) {
        const proj = (t.level as any).spawnMob('minecraft:small_fireball', {
          x: t.x,
          y: t.y + 1.8,
          z: t.z
        });
        if (proj) {
          const dx = nearestTarget.x - t.x;
          const dy = nearestTarget.y - (t.y + 1.8);
          const dz = nearestTarget.z - t.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist > 0) {
            const speed = 0.8;
            (proj as any).setMotion(dx / dist * speed, dy / dist * speed, dz / dist * speed);
          }
          
          // Звук выстрела
          (t.level as any).playSound(
            'minecraft:entity.blaze.shoot',
            t.x, t.y, t.z,
            0.5, 1.2
          );
        }
      }
    }
  }
}
