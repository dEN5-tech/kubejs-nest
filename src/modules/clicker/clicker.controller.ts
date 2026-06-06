import { Controller, OnEvent, Tick } from "../../lib/decorators";
import type { KjsEvent } from "../../lib/decorators";
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
  handleFarm(event: KjsEvent<typeof BlockEvents, 'rightClicked'>): void {
    const player = event.player;
    const uuid = player.uuid.toString();
    const stats = this.service.processClick(uuid);

    // Visual feedback
    player.tell("§a+" + stats.multiplier.toFixed(1) + " 🪙 | Balance: " + Math.floor(stats.clicks));
  }

  // Grindstone = upgrade shop
  @OnEvent(BlockEvents, 'rightClicked', 'minecraft:grindstone')
  handleUpgrade(event: KjsEvent<typeof BlockEvents, 'rightClicked'>): void {
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

  // Right clicked generic block - build tower if holding blaze tower item
  @OnEvent(BlockEvents, 'rightClicked')
  handlePlacement(event: KjsEvent<typeof BlockEvents, 'rightClicked'>): void {
    const player = event.player;
    if (player.mainHandItem.id === 'kubejs:td_blaze_tower_item') {
      const block = event.block;
      // Spawn above the clicked block face
      const x = block.x + 0.5;
      const y = block.y + 1.0;
      const z = block.z + 0.5;
      
      const uuid = player.uuid.toString();
      const stats = this.service.getStats(uuid);
      
      const cost = 50;
      if (stats.clicks >= cost) {
        stats.clicks -= cost;
        
        const level = event.level;
        const tower = level.spawnMob('minecraft_td:blaze_tower', { x, y, z });
        if (tower) {
          (tower as any).setNoGravity(true);
          (tower as any).customName = "§6Огненная Башня";
          
          (level as any).playSound(
            'minecraft:block.stone.place',
            x, y, z,
            1.0, 1.0
          );
          
          if (!player.creativeMode) {
            player.mainHandItem.shrink(1);
          }
          
          (player as any).tell(`§aБашня построена! -${cost} золота. Остаток: ${Math.floor(stats.clicks)}`);
        } else {
          (player as any).tell("§cОшибка при создании башни!");
        }
      } else {
        (player as any).tell(`§cНедостаточно золота! Нужно ${cost} золота.`);
      }
      
      event.cancel();
    }
  }
}
