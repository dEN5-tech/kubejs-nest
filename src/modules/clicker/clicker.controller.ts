import { Controller, OnEvent, Tick } from "../../lib/decorators";
import { UpgradeService } from "./upgrade.service";
import { GameStats } from "./game-stats";
import { inject } from "tsyringe";

@Controller()
export class ClickerController {
  constructor(
    @inject(UpgradeService) private readonly service: UpgradeService,
    @inject(GameStats) private readonly gameStats: GameStats
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

  // Тест Tick - каждые 100 тиков (~5 секунд)
  @Tick(100)
  onTick(event: any): void {
    console.log("[TEST-TICK] Tick event fired! tick=" + event.server.tickCount);
    
    // Демонстрация работы @PersistentState
    // При каждом вызове автоматически сохраняется в NBT!
    if (this.gameStats.currentWave > 0) {
      console.log("[GAME-STATS] Wave=" + this.gameStats.currentWave + 
                 ", Kills=" + this.gameStats.totalKills +
                 ", Started=" + this.gameStats.gameStarted);
    }
  }
  
  // Пример ручного изменения состояния (также сохраняется в NBT)
  startGame(event: any): void {
    this.gameStats.gameStarted = true;
    this.gameStats.currentWave = 1;
    this.gameStats.totalKills = 0;
    this.gameStats.lastPlayer = event.player.name.string;
    
    event.player.tell("§aGame started! Wave: " + this.gameStats.currentWave);
    // Изменения уже в NBT - не нужен ручной save()!
  }
}
