// backend/src/infrastructure/http/controllers/webhooks.controller.ts
import { Controller, Post, Body, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MovementsService } from '../services/movements.service';
import { User } from '@shared/index';

class AutoCaptureDto {
  packageName: string;
  title: string;
  body: string;
}

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('v1/webhooks')
export class WebhooksController {
  constructor(private readonly movementsService: MovementsService) {}

  @Post('auto-capture')
  @ApiOperation({ summary: 'Recibir notificaciones capturadas automáticamente desde Android nativo' })
  @ApiResponse({ status: 201, description: 'Movimiento creado por captura automática con éxito' })
  async autoCapture(
    @Body() dto: AutoCaptureDto,
    @Request() req: { user: User }
  ) {
    if (!dto.packageName || !dto.title || !dto.body) {
      throw new BadRequestException('Los campos packageName, title y body son obligatorios.');
    }
    return this.movementsService.autoCapture(dto.packageName, dto.title, dto.body, req.user);
  }
}
