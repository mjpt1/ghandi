import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, CreateTemplateDto } from './prescriptions.dto';

@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private rx: PrescriptionsService) {}

  private did(user: JwtUser): string {
    if (!user.doctorId) throw new ForbiddenException('فقط پزشکان به این بخش دسترسی دارند');
    return user.doctorId;
  }

  @Roles(Role.DOCTOR)
  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreatePrescriptionDto) {
    return this.rx.create(this.did(user), dto);
  }

  @Roles(Role.PATIENT)
  @Get('mine')
  mine(@CurrentUser() user: JwtUser) {
    if (!user.patientId) throw new ForbiddenException();
    return this.rx.mine(user.patientId);
  }

  @Roles(Role.DOCTOR)
  @Post('templates')
  createTemplate(@CurrentUser() user: JwtUser, @Body() dto: CreateTemplateDto) {
    return this.rx.createTemplate(this.did(user), dto);
  }

  @Roles(Role.DOCTOR)
  @Get('templates')
  listTemplates(@CurrentUser() user: JwtUser) {
    return this.rx.listTemplates(this.did(user));
  }

  @Get(':id')
  byId(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.rx.byId(id, {
      patientId: user.patientId,
      doctorId: user.doctorId,
      role: user.role,
    });
  }
}
