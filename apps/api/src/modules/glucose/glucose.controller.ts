import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { GlucoseService } from './glucose.service';
import { CreateGlucoseLogDto, GlucoseQueryDto } from './dto/glucose.dto';

@Controller('glucose')
export class GlucoseController {
  constructor(private glucose: GlucoseService) {}

  private patientIdOf(user: JwtUser): string {
    if (!user.patientId) throw new ForbiddenException('فقط بیماران به این بخش دسترسی دارند');
    return user.patientId;
  }

  @Roles(Role.PATIENT)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateGlucoseLogDto) {
    return this.glucose.create(this.patientIdOf(user), dto);
  }

  @Roles(Role.PATIENT)
  @Get()
  list(@CurrentUser() user: JwtUser, @Query() q: GlucoseQueryDto) {
    return this.glucose.list(this.patientIdOf(user), q);
  }

  @Roles(Role.PATIENT)
  @Get('stats')
  stats(@CurrentUser() user: JwtUser, @Query('days') days?: string) {
    return this.glucose.stats(this.patientIdOf(user), days ? Number(days) : 7);
  }
}
