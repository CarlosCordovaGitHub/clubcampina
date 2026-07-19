import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { CacheModule } from './cache/cache.module';
import { RealtimeModule } from './realtime/realtime.module';
import { MiembrosModule } from './miembros/miembros.module';
import { VehiculosModule } from './vehiculos/vehiculos.module';
import { ZonasModule } from './zonas/zonas.module';
import { VisionClientModule } from './vision-client/vision-client.module';
import { StorageModule } from './storage/storage.module';
import { EventosAccesoModule } from './eventos-acceso/eventos-acceso.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CacheModule,
    RealtimeModule,
    AuthModule,
    MiembrosModule,
    VehiculosModule,
    ZonasModule,
    VisionClientModule,
    StorageModule,
    EventosAccesoModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
