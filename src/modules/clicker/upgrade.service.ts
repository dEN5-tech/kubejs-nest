import { Injectable } from "../../lib/decorators";
import { StorageService } from "../../lib/storage.service";
import { inject } from "tsyringe";

// Fixed data structure for V8 optimization
interface PlayerStats {
  clicks: number;
  multiplier: number;
  level: number;
  totalEarned: number;
}

@Injectable()
export class UpgradeService {
  // Cache data in Map for fast O(1) access
  private readonly cache: Map<string, PlayerStats> = new Map();
  private readonly DATA_KEY: string = "clicker_data_v1";

  constructor(
    @inject(StorageService) private readonly storage: StorageService
  ) {
    const saved = this.storage.loadGlobal(this.DATA_KEY) || {};
    // Initialize cache with homogeneous objects
    for (const uuid in saved) {
      this.cache.set(uuid, this.createStats(saved[uuid]));
    }
    console.log("[UPGRADE] Loaded " + this.cache.size + " player profiles");
  }

  // Factory for creating objects with same Hidden Class
  private createStats(source: any = {}): PlayerStats {
    return {
      clicks: source.clicks || 0,
      multiplier: source.multiplier || 1,
      level: source.level || 1,
      totalEarned: source.totalEarned || 0
    };
  }

  private getStats(uuid: string): PlayerStats {
    if (!this.cache.has(uuid)) {
      this.cache.set(uuid, this.createStats());
    }
    return this.cache.get(uuid)!;
  }

  // Process click - does NOT save to NBT (performance optimization)
  processClick(uuid: string): PlayerStats {
    const stats = this.getStats(uuid);
    const gain = 1 * stats.multiplier;
    
    stats.clicks += gain;
    stats.totalEarned += gain;
    
    return stats;
  }

  // Upgrade level and multiplier
  upgrade(uuid: string): { success: boolean; cost: number } {
    const stats = this.getStats(uuid);
    const cost = Math.floor(10 * Math.pow(1.5, stats.level));

    if (stats.clicks >= cost) {
      stats.clicks -= cost;
      stats.level++;
      stats.multiplier += 0.5;
      return { success: true, cost };
    }
    return { success: false, cost };
  }

  // Get current stats
  getPlayerStats(uuid: string): PlayerStats {
    return this.getStats(uuid);
  }

  // Batch save - serialize entire cache to NBT at once
  saveAll(): void {
    const data: Record<string, any> = {};
    this.cache.forEach((val, key) => { data[key] = val; });
    this.storage.saveGlobal(this.DATA_KEY, data);
    console.log("[UPGRADE] Batch saved " + this.cache.size + " profiles");
  }
}
