import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

class CheckoutDto {
  @IsEnum(SubscriptionPlan, { message: 'پلن نامعتبر است' })
  plan: SubscriptionPlan;
}

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('checkout')
  checkout(@CurrentUser() user: JwtUser, @Body() dto: CheckoutDto) {
    return this.payments.checkout(user.sub, dto.plan);
  }

  /** callback درگاه — عمومی چون از سمت زرین‌پال فراخوانی می‌شود */
  @Public()
  @Get('verify')
  verify(@Query('paymentId') paymentId: string, @Query('Authority') authority?: string) {
    return this.payments.verify(paymentId, authority);
  }

  @Get('subscriptions')
  mine(@CurrentUser() user: JwtUser) {
    return this.payments.mySubscriptions(user.sub);
  }
}
