import { Global, Module } from '@nestjs/common';
import { MonitoreoGateway } from './monitoreo.gateway';

@Global()
@Module({
  providers: [MonitoreoGateway],
  exports: [MonitoreoGateway],
})
export class RealtimeModule {}
