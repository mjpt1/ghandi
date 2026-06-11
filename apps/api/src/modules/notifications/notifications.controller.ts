import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

class RegisterDeviceDto {
  @IsString()
  @IsNotEmpty()
  fingerprint: string;

  @IsString()
  @IsNotEmpty()
  pushToken: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private notifs: NotificationsService) {}

  /** ثبت توکن FCM دستگاه برای Push */
  @Post('devices')
  registerDevice(
    @CurrentUser() user: JwtUser,
    @Body() dto: RegisterDeviceDto,
    @Headers('user-agent') ua?: string,
  ) {
    return this.notifs.registerDevice(user.sub, dto.fingerprint, dto.pushToken, ua);
  }

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.notifs.list(user.sub);
  }

  @Patch(':id/read')
  read(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.notifs.markRead(user.sub, id);
  }
}
