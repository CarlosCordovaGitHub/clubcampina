import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { VisionClientModule } from '../vision-client/vision-client.module';
import { ZonasModule } from '../zonas/zonas.module';
import { EventosAccesoController } from './eventos-acceso.controller';
import { EventosAccesoService } from './eventos-acceso.service';

@Module({
  imports: [VisionClientModule, StorageModule, ZonasModule],
  controllers: [EventosAccesoController],
  providers: [EventosAccesoService],
})
export class EventosAccesoModule {}
