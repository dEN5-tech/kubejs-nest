import { Module } from "../../lib/decorators";
import { ClickerController } from "./clicker.controller";
import { UpgradeService } from "./upgrade.service";
import { StorageService } from "../../lib/storage.service";

@Module({
  controllers: [ClickerController],
  providers: [UpgradeService, StorageService],
})
export class ClickerModule {}
