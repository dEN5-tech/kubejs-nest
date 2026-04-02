// app-factory.ts

import "reflect-metadata";
import { container } from "tsyringe";
import { NATIVE_REGISTRY } from "./decorators";
import { TickManager } from "./tick-manager";

const FastSet = Java.loadClass("it.unimi.dsi.fastutil.objects.ObjectOpenHashSet");
const JavaList = Java.loadClass("java.util.ArrayList");

export class KubeFactory {
    private static readonly bootstrappedModules = new FastSet();
    // Списки для отложенной инициализации
    private static readonly pendingStates = new JavaList();
    private static readonly paintHandlers = new JavaList();
    private static isInitialized = false;

    static create(rootModule: any): void {
        if (this.isInitialized) return;
        const start = Date.now();

        // 1. Собираем структуру приложения
        this.bootstrapModule(rootModule);

        // 2. Глобальные события (строго здесь, во время загрузки!)
        this.setupGlobalEvents();

        this.isInitialized = true;
        console.log(`[KJS-NATIVE-NEST] System ready in ${Date.now() - start}ms`);
    }

    /**
     * Глобальные события - вызываются ОДИН раз при загрузке
     */
    private static setupGlobalEvents(): void {
        // ЕДИНСТВЕННЫЙ слушатель тика для всего фреймворка
        ServerEvents.tick((event: any) => {
            const server = event.server;
            const tick = server.tickCount;

            // A) Синхронизация NBT (раз в 5 секунд / 100 тиков)
            if (tick % 100 === 0) {
                for (let i = 0; i < this.pendingStates.size(); i++) {
                    const state = this.pendingStates.get(i) as any;
                    this.syncNbt(state.instance, state.nbtKey, server);
                }
            }

            // Б) Обновление HUD раз в 5 тиков
            if (tick % 5 === 0) {
                const players = server.players;
                for (let p = 0; p < players.size(); p++) {
                    this.updatePlayerHud(players.get(p));
                }
            }
        });

        // Загрузка данных при старте мира
        ServerEvents.loaded((event: any) => {
            for (let i = 0; i < this.pendingStates.size(); i++) {
                const state = this.pendingStates.get(i) as any;
                this.loadNbt(state.instance, state.nbtKey, event.server);
            }
        });

        // Регистрация команд
        ServerEvents.commandRegistry((event: any) => {
            const commandsMeta = NATIVE_REGISTRY.get("__pendingCommands");
            if (commandsMeta) {
                for (let i = 0; i < commandsMeta.size(); i++) {
                    const cmd = commandsMeta.get(i) as any;
                    this.registerCommand(event, cmd.instance, cmd.info);
                }
            }
        });
    }

    private static bootstrapModule(moduleClass: any): void {
        if (this.bootstrappedModules.contains(moduleClass)) return;
        this.bootstrappedModules.add(moduleClass);

        const classMeta = NATIVE_REGISTRY.get(moduleClass);
        if (!classMeta) return;

        const config = classMeta.get("config");
        if (!config) return;

        // Провайдеры
        if (config.providers) {
            config.providers.forEach((p: any) => {
                container.registerSingleton(p);
                const instance = container.resolve(p);
                this.registerStateIfPresent(p, instance);
            });
        }

        // Контроллеры
        if (config.controllers) {
            config.controllers.forEach((c: any) => {
                this.initController(c);
            });
        }

        // Импорты
        if (config.imports) {
            config.imports.forEach((m: any) => {
                this.bootstrapModule(m);
            });
        }
    }

    /**
     * Регистрация state если есть
     */
    private static registerStateIfPresent(clazz: any, instance: any): void {
        const meta = NATIVE_REGISTRY.get(clazz);
        if (meta && meta.get("nbtKey")) {
            this.pendingStates.add({ instance, nbtKey: meta.get("nbtKey") });
        }
    }

    /**
     * Инициализация контроллера
     */
    private static initController(controllerClass: any): void {
        const instance = container.resolve(controllerClass);
        const classMeta = NATIVE_REGISTRY.get(controllerClass);
        if (!classMeta) return;

        // Paint хендлеры
        const paints = classMeta.get("paints");
        if (paints) {
            for (let i = 0; i < paints.size(); i++) {
                this.paintHandlers.add({ instance, info: paints.get(i) });
            }
        }

        // @OnEvent биндинг
        const events = classMeta.get("events");
        if (events) {
            for (let i = 0; i < events.size(); i++) {
                this.bindSingleEvent(instance, events.get(i));
            }
        }

        // @Tick регистрация
        const tickTasks = classMeta.get("tickTasks");
        if (tickTasks) {
            const tickManager = container.resolve(TickManager);
            for (let i = 0; i < tickTasks.size(); i++) {
                const t = tickTasks.get(i);
                tickManager.registerTask(instance, t.propertyKey, t.interval);
                console.log(`[KJS-NATIVE] @Tick(${t.interval}) -> ${t.propertyKey}`);
            }
        }

        // @Command регистрация (отложенная)
        const commands = classMeta.get("commands");
        if (commands) {
            let pendingCommands = NATIVE_REGISTRY.get("__pendingCommands");
            if (!pendingCommands) {
                pendingCommands = new JavaList();
                NATIVE_REGISTRY.put("__pendingCommands", pendingCommands);
            }
            for (let i = 0; i < commands.size(); i++) {
                pendingCommands.add({ instance, info: commands.get(i) });
            }
        }
    }

    /**
     * Обновление HUD для игрока (batch paint)
     */
    private static updatePlayerHud(player: any): void {
        const fullPaintBatch: Record<string, any> = {};

        for (let i = 0; i < this.paintHandlers.size(); i++) {
            const h = this.paintHandlers.get(i) as any;
            try {
                const drawData = h.instance[h.info.propertyKey](player);

                if (drawData === null || drawData === undefined) {
                    // Если null - удаляем элемент
                    fullPaintBatch[h.info.elementId] = { remove: true };
                } else {
                    // Иначе обновляем
                    fullPaintBatch[h.info.elementId] = drawData;
                }
            } catch (err) {
                // Игнорируем ошибки в отдельных элементах
            }
        }

        // Отправляем ВСЕ изменения ОДНИМ вызовом
        player.paint(fullPaintBatch);
    }

    /**
     * Регистрация команды Brigadier
     */
    private static registerCommand(event: any, instance: any, info: any): void {
        const { commands } = event;
        event.register(
            commands.literal(info.name)
                .executes(ctx => {
                    try {
                        return instance[info.propertyKey](ctx) || 0;
                    } catch (err) {
                        console.error(`[CMD] Error /${info.name}: ${err}`);
                        return 0;
                    }
                })
        );
        console.log(`[KJS-NATIVE] Command: /${info.name}`);
    }

    /**
     * Загрузка NBT данных
     */
    private static loadNbt(instance: any, key: string, server: any): void {
        const data = server.persistentData[key];
        if (data) Object.assign(instance, data);
        console.log(`[PERSIST] Loaded: ${key}`);
    }

    /**
     * Синхронизация NBT
     */
    private static syncNbt(instance: any, key: string, server: any): void {
        if (!server.persistentData[key]) {
            server.persistentData[key] = {};
        }
        const saved = server.persistentData[key];
        for (const k in instance) {
            const val = instance[k];
            if (typeof val !== 'function' && typeof val !== 'object') {
                saved[k] = val;
            }
        }
    }

    private static bindSingleEvent(instance: any, event: any): void {
        const method = instance[event.propertyKey];
        if (typeof method !== 'function') return;
        const handler = (e: any) => method.call(instance, e);
        this.safeBind(event, handler);
    }

    private static safeBind(event: any, handler: (e: any) => void): void {
        try {
            const { host, methodName, extra } = event;
            if (extra !== undefined) {
                host[methodName](extra, handler);
            } else {
                host[methodName](handler);
            }
        } catch (err) {
            console.error(`[KJS-NATIVE] Failed to bind: ${err}`);
        }
    }
}