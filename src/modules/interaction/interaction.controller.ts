import { Controller, OnEvent } from "../../lib/decorators";
import { InteractionService } from "./interaction.service";
import { inject } from "tsyringe";

@Controller()
export class InteractionController {
  constructor(
    @inject(InteractionService) private service: InteractionService
  ) {}

  @OnEvent(BlockEvents, 'rightClicked', 'minecraft:barrel')
  handleBarrel(event: any): void {
    const count = this.service.increment(event.player.name.string);
    event.player.tell(`NestJS Style: Click #${count}`);
    
    if (count % 5 === 0) {
      event.player.give(Item.of('minecraft:emerald'));
    }
  }

  @OnEvent(BlockEvents, 'rightClicked', 'minecraft:chest')
  handleChest(event: any): void {
    const count = this.service.increment(event.player.name.string);
    event.player.tell(`Chest click #${count}`);
    
    if (count % 3 === 0) {
      event.player.give(Item.of('minecraft:iron_ingot', 3));
    }
  }
}
