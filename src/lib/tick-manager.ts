import { Injectable } from "./decorators";
import { singleton } from "tsyringe";

// Типизация для KubeJS глобальных объектов - они поддерживают вызов как функции
type KubeEventFn = (event: string, handler: (e: any) => void) => void;

const JavaList = Java.loadClass("java.util.ArrayList");

//declare const ServerEvents: KubeEventFn; // Не используем - вызывает ошибку TS

export interface TickTask {
  instance: any;
  methodName: string;
  interval: number;
  offset: number;
}

@Injectable()
@singleton()
export class TickManager {
  private tasks = new JavaList();

  constructor() {
    // Правильный синтаксис для KubeJS 1.20+: вызов метода .tick()
    ServerEvents.tick((event: any) => {
      this.runTick(event);
    });
    console.log('[TICK-MANAGER] Bound to ServerEvents.tick');
  }

  registerTask(instance: any, methodName: string, interval: number) {
    this.tasks.add({
      instance,
      methodName,
      interval,
      offset: Math.floor(Math.random() * interval),
    });
  }

  runTick(event: any) {
    const currentTick = event.server.tickCount;
    const size = this.tasks.size();

    for (let i = 0; i < size; i++) {
      const task = this.tasks.get(i) as TickTask;
      if ((currentTick + task.offset) % task.interval === 0) {
        try {
          task.instance[task.methodName](event);
        } catch (err) {
          console.error(`Tick Error in ${task.methodName}: ${err}`);
        }
      }
    }
  }
}
