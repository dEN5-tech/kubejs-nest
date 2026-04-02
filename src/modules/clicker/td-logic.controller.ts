import { Controller, OnEvent, OnPacket, Tick } from "../../lib/decorators";
import { GameStats } from "./game-stats";
import { inject } from "tsyringe";

/**
 * TDLogicController - логика Tower Defense
 */
@Controller()
export class TDLogicController {
  constructor(
    @inject(GameStats) private stats: GameStats
  ) {}

  /**
   * Слушаем пакеты от клиента (нажатие кнопки в GUI)
   */
  @OnPacket('td:start_game')
  onStartGame(event: any): void {
    this.stats.currentWave = 1;
    this.stats.totalKills = 0;
    this.stats.gameStarted = true;
    this.stats.lastPlayer = event.player.name?.string || 'Unknown';
    
    event.player.tell("§a🏰 Tower Defense: Игра началась! Волна 1");
  }

  /**
   * Обработка смерти моба
   */
  @OnEvent(EntityEvents, 'death', 'minecraft:zombie')
  onZombieDeath(event: any): void {
    if (event.source?.player) {
      this.stats.addKill(event.source.player);
      event.source.player.tell("§6+1 🧟 убит! Всего: " + this.stats.totalKills);
    }
  }

  /**
   * Обработка смерти скелета
   */
  @OnEvent(EntityEvents, 'death', 'minecraft:skeleton')
  onSkeletonDeath(event: any): void {
    if (event.source?.player) {
      this.stats.addKill(event.source.player);
      event.source.player.tell("§6+1 💀 убит! Всего: " + this.stats.totalKills);
    }
  }

  /**
   * Обработка смерти крипера
   */
  @OnEvent(EntityEvents, 'death', 'minecraft:creeper')
  onCreeperDeath(event: any): void {
    if (event.source?.player) {
      this.stats.addKill(event.source.player);
      event.source.player.tell("§6+1 💚 убит! Всего: " + this.stats.totalKills);
    }
  }

  /**
   * Проверка волн каждые 5 секунд
   */
  @Tick(100)
  onTick(event: any): void {
    if (!this.stats.gameStarted) return;
    
    // Каждые 10 убийств - новая волна
    if (this.stats.totalKills > 0 && this.stats.totalKills % 10 === 0) {
      this.stats.nextWave();
      const players = event.server.players;
      for (let i = 0; i < players.size(); i++) {
        players.get(i).tell("§c⚔️ Волна " + this.stats.currentWave + " началась!");
      }
    }
  }
}