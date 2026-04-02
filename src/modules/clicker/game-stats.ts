import { PersistentState } from "../../lib/decorators";
import { NetworkService } from "../../lib/network.service";
import { singleton, inject } from "tsyringe";

/**
 * Persistent Game Stats - хранит состояние игры и отправляет обновления клиенту
 */
@PersistentState('minecraft_td_game_stats')
@singleton()  // ВАЖНО: singleton ВНИЗУ, ближе к классу
export class GameStats {
  // Простые JS поля - автоматически сохраняются в NBT!
  public currentWave: number = 1;
  public totalKills: number = 0;
  public baseHealth: number = 100;
  public lastPlayer: string = '';
  public gameStarted: boolean = false;

  constructor(@inject(NetworkService) private network: NetworkService) {
    // @inject гарантирует, что tsyringe поймет тип в Rhino
  }

  /**
   * Добавить убийство и отправить обновление клиенту
   */
  addKill(player: any): void {
    this.totalKills++;
    this.lastPlayer = player.name?.string || 'Unknown';
    
    // Отправляем пакет на клиент для обновления UI
    const data = this.network.createTag({
      type: 'kill',
      kills: this.totalKills,
      wave: this.currentWave,
      player: this.lastPlayer
    });
    this.network.broadcast(player.server, 'td:update', data);
  }

  /**
   * Увеличить волну
   */
  nextWave(): void {
    this.currentWave++;
    console.log('[GAME-STATS] Wave: ' + this.currentWave);
  }

  /**
   * Проверить завершение волны
   */
  isWaveComplete(killsRequired: number): boolean {
    return this.totalKills >= killsRequired;
  }
}