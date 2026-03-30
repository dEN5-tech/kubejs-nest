import { Module } from "./lib/decorators";
import { InteractionModule } from "./modules/interaction/interaction.module";
import { StorageService } from "./lib/storage.service";

@Module({
  imports: [InteractionModule],
  controllers: [],
  providers: [StorageService], // Global provider available to all modules
})
export class AppModule {}
