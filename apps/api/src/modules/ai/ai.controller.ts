import { Body, Controller, ForbiddenException, Get, Param, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

class FoodPhotoDto {
  @IsString()
  @IsNotEmpty({ message: 'تصویر ارسال نشده است' })
  imageBase64: string;
}
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}

  /** بینش‌های مربی هوشمند برای بیمار جاری */
  @Roles(Role.PATIENT)
  @Get('coach')
  coach(@CurrentUser() user: JwtUser) {
    if (!user.patientId) throw new ForbiddenException();
    return this.ai.coachInsights(user.patientId);
  }

  /** پیش‌بینی روند قند دو ساعت آینده */
  @Roles(Role.PATIENT)
  @Get('predict')
  predict(@CurrentUser() user: JwtUser) {
    if (!user.patientId) throw new ForbiddenException();
    return this.ai.predictGlucose(user.patientId);
  }

  /** تشخیص غذا از روی عکس */
  @Roles(Role.PATIENT)
  @Post('food-photo')
  foodPhoto(@Body() dto: FoodPhotoDto) {
    return this.ai.detectFood(dto.imageBase64);
  }

  /** تحلیل بالینی یک بیمار — فقط پزشک */
  @Roles(Role.DOCTOR, Role.ADMIN)
  @Get('clinical/:patientId')
  clinical(@Param('patientId') patientId: string) {
    return this.ai.doctorAnalysis(patientId);
  }
}
