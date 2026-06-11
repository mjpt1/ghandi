import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Headers,
  Post,
} from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { CgmService } from './cgm.service';

class ConnectDto {
  @IsString()
  @IsIn(['dexcom', 'libre'], { message: 'سنسور پشتیبانی‌شده: dexcom یا libre' })
  provider: string;
}

@Controller('cgm')
export class CgmController {
  constructor(private cgm: CgmService) {}

  private pid(user: JwtUser): string {
    if (!user.patientId) throw new ForbiddenException();
    return user.patientId;
  }

  @Roles(Role.PATIENT)
  @Post('connect')
  connect(@CurrentUser() user: JwtUser, @Body() dto: ConnectDto) {
    return this.cgm.connect(this.pid(user), dto.provider);
  }

  @Roles(Role.PATIENT)
  @Delete('connect')
  disconnect(@CurrentUser() user: JwtUser) {
    return this.cgm.disconnect(this.pid(user));
  }

  @Roles(Role.PATIENT)
  @Post('sync')
  sync(@CurrentUser() user: JwtUser) {
    return this.cgm.sync(this.pid(user));
  }

  /** ورودی bridge خارجی (مثلاً xDrip / Nightscout) */
  @Public()
  @Post('webhook')
  webhook(
    @Headers('x-cgm-secret') secret: string | undefined,
    @Body() body: { patientId: string; readings: { valueMgDl: number; measuredAt: string }[] },
  ) {
    return this.cgm.webhook(secret, body);
  }
}
