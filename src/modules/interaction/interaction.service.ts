import { Injectable } from "../../lib/decorators";
import { StorageService } from "../../lib/storage.service";
import { inject } from "tsyringe";

@Injectable()
export class InteractionService {
  private stats: Record<string, number> = {};
  private readonly DATA_KEY = "minecraft_td_clicks";

  constructor(
    @inject(StorageService) private storage: StorageService
  ) {
    // Load data from server NBT at startup
    this.stats = this.storage.loadGlobal(this.DATA_KEY) || {};
    console.log(`[SERVICE] Persistence initialized using Server NBT`);
  }

  increment(player: string): number {
    const val = (this.stats[player] || 0) + 1;
    this.stats[player] = val;
    
    // Save back to server NBT
    this.storage.saveGlobal(this.DATA_KEY, this.stats);
    return val;
  }

  getStats(player: string): number {
    return this.stats[player] || 0;
  }
}
