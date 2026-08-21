// backend/src/infrastructure/http/controllers/cdts.controller.ts
import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { CdtsService } from '../services/cdts.service';
import { CreateCdtDto } from '../../../../../shared/models/cdts/cdt.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('cdts')
@UseGuards(JwtAuthGuard)
export class CdtsController {
  constructor(private readonly cdtsService: CdtsService) {}

  @Post()
  async create(@Body() createCdtDto: CreateCdtDto, @Request() req) {
    return this.cdtsService.create(createCdtDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.cdtsService.findAllForHousehold(req.user.householdId, req.user.id);
  }
}
