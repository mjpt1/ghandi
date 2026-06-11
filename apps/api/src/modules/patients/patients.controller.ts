import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { PatientsService } from './patients.service';
import { CreateHealthLogDto, CreateMealDto } from './patients.dto';

@Controller('patients')
export class PatientsController {
  constructor(private patients: PatientsService) {}

  private pid(user: JwtUser): string {
    if (!user.patientId) throw new ForbiddenException('فقط بیماران به این بخش دسترسی دارند');
    return user.patientId;
  }

  // ---------- بیمار ----------
  @Roles(Role.PATIENT)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.patients.me(this.pid(user));
  }

  @Roles(Role.PATIENT)
  @Post('me/health-logs')
  addHealthLog(@CurrentUser() user: JwtUser, @Body() dto: CreateHealthLogDto) {
    return this.patients.addHealthLog(this.pid(user), dto);
  }

  @Roles(Role.PATIENT)
  @Get('me/health-logs')
  listHealthLogs(@CurrentUser() user: JwtUser, @Query('kind') kind?: string) {
    return this.patients.listHealthLogs(this.pid(user), kind);
  }

  @Roles(Role.PATIENT)
  @Post('me/meals')
  addMeal(@CurrentUser() user: JwtUser, @Body() dto: CreateMealDto) {
    return this.patients.addMeal(this.pid(user), dto);
  }

  @Roles(Role.PATIENT)
  @Get('me/meals')
  listMeals(@CurrentUser() user: JwtUser) {
    return this.patients.listMeals(this.pid(user));
  }

  // ---------- پزشک ----------
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Get()
  list() {
    return this.patients.listForDoctor();
  }

  @Roles(Role.DOCTOR, Role.ADMIN)
  @Get(':id')
  detail(@Param('id') id: string) {
    return this.patients.detail(id);
  }
}
