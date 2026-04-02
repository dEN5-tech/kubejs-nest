import { ItemRegistry } from "../../../lib/decorators";

/**
 * Coin - валюта Tower Defense
 */
@ItemRegistry('kubejs:td_coin', 'kubejs:td_main_tab')
export class CoinItem {
  configure(builder: any): void {
    builder
      .texture('minecraft:item/gold_nugget')
      .maxStackSize(64)
      .glow(true);
  }
}

/**
 * Grid Tool - инструмент для установки башен
 */
@ItemRegistry('kubejs:td_grid_tool', 'kubejs:td_main_tab')
export class GridToolItem {
  configure(builder: any): void {
    builder
      .texture('minecraft:item/stick')
      .maxStackSize(1);
  }
}

/**
 * Wave Spawner - предмет для запуска волны
 */
@ItemRegistry('kubejs:td_wave_spawner', 'kubejs:td_main_tab')
export class WaveSpawnerItem {
  configure(builder: any): void {
    builder
      .texture('minecraft:item/wheat')
      .maxStackSize(1)
      .glow(true);
  }
}

/**
 * Speed Boost Potion - зелье скорости
 */
@ItemRegistry('kubejs:td_speed_potion', 'kubejs:td_main_tab')
export class SpeedPotionItem {
  configure(builder: any): void {
    builder
      .texture('minecraft:item/potion')
      .maxStackSize(16);
  }
}
