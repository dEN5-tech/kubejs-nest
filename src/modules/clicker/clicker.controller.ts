import { Controller, OnEvent } from "../../lib/decorators";
import { UpgradeService } from "./upgrade.service";
import { inject } from "tsyringe";

@Controller()
export class ClickerController {
  constructor(
    @inject(UpgradeService) private readonly service: UpgradeService
  ) {}

  // Barrel = click to earn
  @OnEvent(BlockEvents, 'rightClicked', 'minecraft:barrel')
  handleFarm(event: any): void {
    const player = event.player;
    const uuid = player.uuid.toString();
    const stats = this.service.processClick(uuid);

    // Visual feedback
    player.tell("§a+" + stats.multiplier.toFixed(1) + " 🪙 | Balance: " + Math.floor(stats.clicks));
  }

  // Grindstone = upgrade shop
  @OnEvent(BlockEvents, 'rightClicked', 'minecraft:grindstone')
  handleUpgrade(event: any): void {
    const player = event.player;
    const uuid = player.uuid.toString();
    const result = this.service.upgrade(uuid);

    if (result.success) {
      player.tell("§aUpgrade purchased! Cost: " + result.cost);
    } else {
      player.tell("§cNot enough funds! Need: " + result.cost);
    }
  }
}
