import { Injectable } from "./decorators";

/**
 * NetworkService - отправка пакетов между сервером и клиентом
 */
@Injectable()
export class NetworkService {
  
  /**
   * Отправить данные игроку
   */
  send(player: any, channel: string, data: any): void {
    player.sendData(channel, data);
  }

  /**
   * Отправить данные всем игрокам
   */
  broadcast(server: any, channel: string, data: any): void {
    const players = server.players;
    for (let i = 0; i < players.size(); i++) {
      players.get(i).sendData(channel, data);
    }
  }

  /**
   * Отправить данные всем кроме отправителя
   */
  broadcastExcept(server: any, exclude: any, channel: string, data: any): void {
    const players = server.players;
    for (let i = 0; i < players.size(); i++) {
      const p = players.get(i);
      if (p !== exclude) {
        p.sendData(channel, data);
      }
    }
  }

  /**
   * Создать CompoundTag из объекта
   */
  createTag(obj: Record<string, any>): any {
    const tag = Java.loadClass('net.minecraft.nbt.CompoundTag');
    const nbt = new tag();
    for (const key in obj) {
      const val = obj[key];
      if (typeof val === 'number' && Number.isInteger(val)) {
        nbt.putInt(key, val);
      } else if (typeof val === 'number') {
        nbt.putDouble(key, val);
      } else if (typeof val === 'string') {
        nbt.putString(key, val);
      } else if (typeof val === 'boolean') {
        nbt.putBoolean(key, val);
      }
    }
    return nbt;
  }
}