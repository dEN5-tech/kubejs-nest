import { BlockRegistry } from "../../../lib/decorators";

/**
 * Basic Tower Block - базовая башня
 */
@BlockRegistry('kubejs:td_basic_tower', 'kubejs:td_main_tab')
export class BasicTowerBlock {
  configure(builder: any): void {
    builder
      .stoneSoundType()
      .mapColor('stone')
      .textureAll('minecraft:block/stone_bricks')
      .hardness(2.0)
      .tagBlock('kubejs:td_tower')
      .tagItem('kubejs:td_tower');
  }
}

/**
 * Ice Tower Block - ледяная башня
 */
@BlockRegistry('kubejs:td_ice_tower', 'kubejs:td_main_tab')
export class IceTowerBlock {
  configure(builder: any): void {
    builder
      .stoneSoundType()
      .mapColor('ice')
      .textureAll('minecraft:block/packed_ice')
      .hardness(2.0)
      .tagBlock('kubejs:td_tower')
      .tagItem('kubejs:td_tower');
  }
}

/**
 * Fire Tower Block - огненная башня
 */
@BlockRegistry('kubejs:td_fire_tower', 'kubejs:td_main_tab')
export class FireTowerBlock {
  configure(builder: any): void {
    builder
      .stoneSoundType()
      .mapColor('nether')
      .textureAll('minecraft:block/magma')
      .lightLevel(0.5)
      .hardness(2.0)
      .tagBlock('kubejs:td_tower')
      .tagItem('kubejs:td_tower');
  }
}

/**
 * Gold Mine Block - золотая шахта
 */
@BlockRegistry('kubejs:td_gold_mine', 'kubejs:td_main_tab')
export class GoldMineBlock {
  configure(builder: any): void {
    builder
      .stoneSoundType()
      .mapColor('gold')
      .textureAll('minecraft:block/gold_ore')
      .hardness(3.5)
      .tagBlock('kubejs:td_tower')
      .tagItem('kubejs:td_tower');
  }
}
