#NestJS-Style KubeJS Framework

A modern, modular architecture for KubeJS (Minecraft Forge/Fabric mod) inspired by NestJS.

## Version Information

| Component | Version |
|-----------|---------|
| Minecraft | 20.0.1 |
| KubeJS | 2001.6.5-build.16 |
| Platform | Fabric |
| ProbeJS | Latest |

## Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation
```bash
pnpm install
```

### Build
```bash
npm run build
```

### Development (Watch Mode)
```bash
npm run watch
```

### Usage in Minecraft

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Copy output to KubeJS:**
   Copy `dist/server_scripts/index.js` to your modpack's `kubejs/server_scripts/` folder

3. **Reload in game:**
   ```
   /reload
   ```

## Working Log (Verification)

```
[INIT] KubeJS 2001.6.5-build.16; MC 2001 fabric
[INIT] Loaded plugins:
[INIT] - dev.latvian.mods.kubejs.fabric.BuiltinKubeJSFabricPlugin
[INIT] - dev.latvian.mods.kubejs.fabric.BuiltinKubeJSFabricClientPlugin
[INIT] - com.probejs.ProbeJSPlugin
[INFO] index.js#2175: [SERVICE] Persistence initialized using Server NBT
[INFO] index.js#2123: [KJS-NEST] Binding rightClicked(minecraft:barrel) -> handleBarrel
[INFO] index.js#2123: [KJS-NEST] Binding rightClicked(minecraft:chest) -> handleChest
[INFO] index.js#2098: [KJS-NEST] System ready in 3ms
[INFO] index.js#2226: [SERVER] MinecraftTD NestJS-style app started!
[INFO] Loaded script server_scripts:index.js in 0.013 s
[INFO] Loaded 1/1 KubeJS server scripts in 0.017 s with 0 errors and 0 warnings
```

## Project Structure

```
MinecraftTD/
├── src/
│   ├── lib/
│   │   ├── decorators.ts      # @Module, @Controller, @Injectable, @OnEvent
│   │   ├── app-factory.ts     # KubeFactory - auto bootstrap modules
│   │   └── storage.service.ts # persistentData storage (NBT)
│   ├── modules/
│   │   └── interaction/
│   │       ├── interaction.module.ts
│   │       ├── interaction.controller.ts
│   │       └── interaction.service.ts
│   ├── app.module.ts          # Root module
│   └── server.index.ts        # Entry point
├── build.js                   # Build system with Rhino patches
├── .gitignore
├── package.json
└── tsconfig.json
```

## Architecture

### Decorators

| Decorator | Description |
|-----------|-------------|
| `@Module({ controllers, providers, imports })` | Define module metadata |
| `@Controller()` | Mark class as controller (auto-registers with tsyringe) |
| `@Injectable()` | Mark class as service (singleton) |
| `@OnEvent(host, method, filter)` | Subscribe to KubeJS events |

### Storage Service

Uses KubeJS built-in `persistentData` (NBT) - no Java file I/O needed:
```typescript
storage.saveGlobal('key', { data: 'value' })
const data = storage.loadGlobal('key')
```

### KubeFactory

Automatically bootstraps all modules and registers event handlers:
```typescript
KubeFactory.create(AppModule)
```

## ProbeJS Usage

ProbeJS provides IDE autocomplete for KubeJS. Install in VS Code:

1. Install ProbeJS extension
2. Generate type definitions:
   ```
   /probejs export
   ```
3. Types are generated to `probe/generated/`

### Example: Accessing Player
```typescript
const player: Internal.Player = event.player
player.give(Item.of('minecraft:diamond', 1))
player.tell(Text.green('Hello!'))
```

## Build System (build.js)

Custom build pipeline with Rhino compatibility patches:

- **esbuild**: Bundles TypeScript
- **Babel**: Transpiles to ES5 for Rhino
- **Patches**: Fixes for `_loop`, `_step`, `ar` issues

### Key Patches
```javascript
// Safe typeof checks prevent ReferenceError
finalCode = finalCode.replace(/(_loop\d*)\(\);/g, 
  '$1(typeof _step !== "undefined" ? _step : undefined, ...)')
```

## Features

- ✅ NestJS-style modular architecture
- ✅ Dependency Injection (tsyringe)
- ✅ Persistent storage (NBT)
- ✅ Event decorators
- ✅ Rhino-safe build pipeline

## License

MIT
"# kubejs-nest" 
