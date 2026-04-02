import { CreativeTab } from "../../../lib/decorators";

/**
 * Creative Tab для Tower Defense контента
 */
@CreativeTab('kubejs:td_main_tab')
export class TDMainTab {
  configure(builder: any): void {
    builder
      .icon(() => Item.of('minecraft:diamond_sword'))
      .displayName("Tower Defense");
  }
}
