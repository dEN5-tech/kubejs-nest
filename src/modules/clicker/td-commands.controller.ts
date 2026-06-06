import { Controller, Command } from "../../lib/decorators";
import { GameStats } from "./game-stats";
import { UpgradeService } from "./upgrade.service";
import { inject } from "tsyringe";

/**
 * TDCommandsController - команды Tower Defense
 */
@Controller()
export class TDCommandsController {
  constructor(
    @inject(GameStats) private stats: GameStats,
    @inject(UpgradeService) private service: UpgradeService
  ) {}

  /**
   * Посмотреть статистику: /td_info
   */
  @Command('td_info')
  showInfo(ctx: any): number {
    const player = ctx.source.player;

    player.tell([
      '=== TD STATUS ===\n',
      'Wave: ' + this.stats.currentWave + '\n',
      'Kills: ' + this.stats.totalKills + '\n',
      'Started: ' + (this.stats.gameStarted ? 'YES' : 'NO')
    ].join(''));

    return 1;
  }

  /**
   * Запустить игру: /td_start
   */
  @Command('td_start')
  startGame(ctx: any): number {
    if (this.stats.gameStarted) {
      ctx.source.player.tell('Игра уже запущена!');
      return 0;
    }

    this.stats.gameStarted = true;
    this.stats.currentWave = 1;
    this.stats.totalKills = 0;
    this.stats.lastPlayer = ctx.source.player.name.string;

    ctx.source.server.tell('Tower Defense начался!');
    ctx.source.player.tell('Добро пожаловать в бой!');
    
    return 1;
  }

  /**
   * Остановить игру: /td_stop
   */
  @Command('td_stop')
  stopGame(ctx: any): number {
    if (!this.stats.gameStarted) {
      ctx.source.player.tell('Игра не запущена!');
      return 0;
    }

    this.stats.gameStarted = false;
    ctx.source.server.tell('Tower Defense остановлен!');
    
    return 1;
  }

  /**
   * Добавить убийство (тест): /td_addkill
   */
  @Command('td_addkill')
  addKill(ctx: any): number {
    this.stats.addKill(ctx.source.player);
    ctx.source.player.tell('+1 убийство добавлено!');
    return 1;
  }

  /**
   * Добавить золото (тест): /td_addgold
   */
  @Command('td_addgold')
  addGold(ctx: any): number {
    const player = ctx.source.player;
    const uuid = player.uuid.toString();
    const stats = this.service.getStats(uuid);
    stats.clicks += 100;
    (player as any).tell(`§aДобавлено 100 золота! Баланс: ${Math.floor(stats.clicks)}`);
    return 1;
  }
}