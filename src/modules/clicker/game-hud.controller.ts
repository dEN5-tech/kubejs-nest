import { Controller, Paint } from "../../lib/decorators";
import { GameStats } from "./game-stats";
import { inject } from "tsyringe";

/**
 * GameHUDController - Отрисовка HUD для Tower Defense
 * Текст и кнопка разделены для корректного отображения
 */
@Controller()
export class GameHUDController {
  constructor(
    @inject(GameStats) private stats: GameStats
  ) {}

  /**
   * Синяя подложка кнопки START GAME
   */
  @Paint('td_start_btn_bg')
  drawStartButtonBg(player: any): any {
    if (this.stats.gameStarted) return null; // Скрываем когда игра началась

    return {
      type: 'rectangle',
      x: 10,
      y: 10,
      w: 80,
      h: 20,
      color: '#4169E1',
      click: 'td:start_game',
      draw: 'ingame'
    };
  }

  /**
   * Текст кнопки START GAME (отдельный элемент!)
   */
  @Paint('td_start_btn_text')
  drawStartButtonText(player: any): any {
    if (this.stats.gameStarted) return null;

    return {
      type: 'text',
      text: 'START GAME',
      x: 18,
      y: 15,
      color: 'white',
      scale: 1.0,
      draw: 'ingame'
    };
  }

  /**
   * Панель информации (когда игра идет)
   */
  @Paint('td_info_panel')
  drawInfoPanel(player: any): any {
    if (!this.stats.gameStarted) return null;

    return {
      type: 'text',
      text: `WAVE: ${this.stats.currentWave} | KILLS: ${this.stats.totalKills}`,
      x: 10,
      y: 10,
      color: '#FFD700',
      scale: 1.2,
      draw: 'ingame'
    };
  }

  /**
   * Прогресс бар (отдельный элемент)
   */
  @Paint('td_progress_bar')
  drawProgressBar(player: any): any {
    if (!this.stats.gameStarted) return null;

    const progress = Math.min((this.stats.totalKills % 10) / 10, 1);
    const color = progress > 0.8 ? '#FF4444' : '#44FF44';

    return {
      type: 'rectangle',
      x: 10,
      y: 35,
      w: 100 * progress,
      h: 5,
      color: color,
      draw: 'ingame'
    };
  }
}