import { Module } from "./lib/decorators";
import { ClickerModule } from "./modules/clicker/clicker.module";

@Module({
  imports: [ClickerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
