import { Module } from "./lib/decorators";
import { ClickerModule } from "./modules/clicker/clicker.module";
import { TickManager } from "./lib/tick-manager";
import { NetworkService } from "./lib/network.service";

@Module({
  imports: [ClickerModule],
  controllers: [],
  providers: [TickManager, NetworkService],
})
export class AppModule {}
