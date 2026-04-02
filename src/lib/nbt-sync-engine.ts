/**
 * NbtSyncEngine - Shadow NBT Persistence
 * Проксирует JS свойства напрямую в Java NBT методы
 */

export class NbtSyncEngine {
  /**
   * Превращает класс в прокси для NBT
   */
  static bind(instance: any, nbt: any, fieldMap: any): void {
    const entries = fieldMap.entrySet();
    const iterator = entries.iterator();

    while (iterator.hasNext()) {
      const entry = iterator.next();
      const key = entry.getKey();
      const type = entry.getValue();

      Object.defineProperty(instance, key, {
        get: () => {
          if (type === 'int') return nbt.getInt(key);
          if (type === 'double') return nbt.getDouble(key);
          if (type === 'string') return nbt.getString(key);
          if (type === 'boolean') return nbt.getBoolean(key);
          if (type === 'long') return nbt.getLong(key);
          if (type === 'uuid') return nbt.getUUID(key);
          return null;
        },
        set: (v: any) => {
          if (type === 'int') nbt.putInt(key, v);
          else if (type === 'double') nbt.putDouble(key, v);
          else if (type === 'string') nbt.putString(key, v);
          else if (type === 'boolean') nbt.putBoolean(key, v);
          else if (type === 'long') nbt.putLong(key, v);
          else if (type === 'uuid') nbt.putUUID(key, v);
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  /**
   * Создать новый CompoundTag
   */
  static createTag(): any {
    return Java.loadClass('net.minecraft.nbt.CompoundTag');
  }
}