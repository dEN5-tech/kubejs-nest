import { Module } from "../../lib/decorators";
import { ClickerController } from "./clicker.controller";
import { TDLogicController } from "./td-logic.controller";
import { TDCommandsController } from "./td-commands.controller";
import { GameHUDController } from "./game-hud.controller";
import { UpgradeService } from "./upgrade.service";
import { StorageService } from "../../lib/storage.service";
import { GameStats } from "./game-stats";

// Entity Controllers
import { FediaSkeleton } from "./entities/fedia-skeleton";
import { TitanZombieBehavior } from "./entities/titan-zombie-behavior";

// Registry компоненты (для регистрации в креативе)
import "./tabs/td-tabs";
import "./items/td-items";
import "./blocks/td-blocks";

@Module({
  controllers: [ClickerController, TDLogicController, TDCommandsController, GameHUDController],
  providers: [UpgradeService, StorageService, GameStats, FediaSkeleton, TitanZombieBehavior],
})
export class ClickerModule {}
