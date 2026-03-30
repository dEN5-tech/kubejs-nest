/**
 * MinecraftTD - NestJS-style Entry Point
 * Uses KubeFactory to bootstrap all modules
 */

import 'reflect-metadata'
import { KubeFactory } from './lib/app-factory'
import { AppModule } from './app.module'

// Start the application like NestJS!
KubeFactory.create(AppModule)

console.log('[SERVER] MinecraftTD NestJS-style app started!')
