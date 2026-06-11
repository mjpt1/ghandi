import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { AppointmentKind, AppointmentStatus, Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { AppointmentsService } from './appointments.service';

class BookDto {
  @IsString()
  @IsNotEmpty()
  doctorId: string;

  @IsEnum(AppointmentKind, { message: 'نوع ویزیت نامعتبر است' })
  kind: AppointmentKind;

  @IsDateString({}, { message: 'زمان نوبت نامعتبر است' })
  scheduledAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

class StatusDto {
  @IsEnum(AppointmentStatus, { message: 'وضعیت نامعتبر است' })
  status: AppointmentStatus;
}

@Controller('appointments')
export class AppointmentsController {
  constructor(private appts: AppointmentsService) {}

  @Roles(Role.PATIENT)
  @Post()
  book(@CurrentUser() user: JwtUser, @Body() dto: BookDto) {
    if (!user.patientId) throw new ForbiddenException();
    return this.appts.book(user.patientId, dto);
  }

  @Roles(Role.PATIENT)
  @Get('mine')
  mine(@CurrentUser() user: JwtUser) {
    if (!user.patientId) throw new ForbiddenException();
    return this.appts.mine(user.patientId);
  }

  @Roles(Role.DOCTOR)
  @Get('doctor')
  forDoctor(@CurrentUser() user: JwtUser) {
    if (!user.doctorId) throw new ForbiddenException();
    return this.appts.forDoctor(user.doctorId);
  }

  @Roles(Role.DOCTOR)
  @Patch(':id/status')
  setStatus(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() dto: StatusDto) {
    if (!user.doctorId) throw new ForbiddenException();
    return this.appts.setStatus(user.doctorId, id, dto.status);
  }
}
