import { Injectable } from "./decorators";

@Injectable()
export class StorageService {
  /**
   * Saves data to server NBT (world/data/kubejs_persistent_data.nbt)
   */
  saveGlobal(key: string, data: any): void {
    const server = Utils.server;
    if (!server) return;

    // KubeJS automatically converts JS {} to NBT CompoundTag
    server.persistentData.put(key, data);
  }

  /**
   * Loads data. Returns empty object if no data exists.
   */
  loadGlobal(key: string): any {
    const server = Utils.server;
    if (!server) return {};

    // Check if key exists in NBT
    if (!server.persistentData.contains(key)) {
      return {};
    }

    const data = server.persistentData.get(key);
    
    // CRITICAL FOR RHINO:
    // Force convert Java object back to clean JS object via JSON
    // This removes weird "entries" and "0.0" from console
    try {
      const jsonString = global.JSON.stringify(data);
      return global.JSON.parse(jsonString);
    } catch (e) {
      return {};
    }
  }
}
