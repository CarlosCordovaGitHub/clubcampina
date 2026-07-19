import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get('resumen')
  resumen(
    @Query('dias', new ParseIntPipe({ optional: true })) dias?: number,
  ) {
    return this.reportesService.resumen(
      Math.min(Math.max(dias ?? 7, 1), 365),
    );
  }
}
