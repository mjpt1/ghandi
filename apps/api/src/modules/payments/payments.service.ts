import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** قیمت پلن‌ها (ریال) */
const PLAN_PRICE: Record<SubscriptionPlan, bigint> = {
  FREE: 0n,
  PRO: 4_900_000n,     // ماهانه
  CLINIC: 29_000_000n, // ماهانه
};

/**
 * پرداخت با زرین‌پال
 * بدون MERCHANT_ID → حالت Mock: پرداخت بلافاصله موفق ثبت می‌شود (برای توسعه).
 */
@Injectable()
export class PaymentsService {
  private logger = new Logger('Payments');
  private merchantId = process.env.ZARINPAL_MERCHANT_ID;
  private callback = process.env.PAYMENT_CALLBACK_URL ?? 'http://localhost:3000/payment/callback';

  constructor(private prisma: PrismaService) {}

  // ---------- شروع پرداخت ----------
  async checkout(userId: string, plan: SubscriptionPlan) {
    if (plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('پلن رایگان نیازی به پرداخت ندارد');
    }
    const amountRial = PLAN_PRICE[plan];

    const subscription = await this.prisma.subscription.create({
      data: { userId, plan, status: SubscriptionStatus.ACTIVE, endsAt: null },
    });
    const payment = await this.prisma.payment.create({
      data: {
        subscriptionId: subscription.id,
        amountRial,
        gateway: this.merchantId ? 'zarinpal' : 'mock',
      },
    });

    // ----- حالت Mock -----
    if (!this.merchantId) {
      this.logger.warn('بدون ZARINPAL_MERCHANT_ID — پرداخت Mock');
      await this.activate(payment.id, 'MOCK-' + payment.id.slice(-8));
      return {
        mode: 'mock',
        paymentId: payment.id,
        redirectUrl: null,
        messageFa: 'حالت توسعه: پرداخت به‌صورت آزمایشی موفق ثبت شد و اشتراک فعال است.',
      };
    }

    // ----- زرین‌پال واقعی -----
    const res = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: Number(amountRial),
        currency: 'IRR',
        callback_url: `${this.callback}?paymentId=${payment.id}`,
        description: `اشتراک ${plan} گلوسیا`,
      }),
    });
    const data = (await res.json()) as { data?: { authority?: string } };
    const authority = data?.data?.authority;
    if (!authority) throw new BadRequestException('خطا در ایجاد تراکنش زرین‌پال');

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { refId: authority },
    });

    return {
      mode: 'zarinpal',
      paymentId: payment.id,
      redirectUrl: `https://www.zarinpal.com/pg/StartPay/${authority}`,
      messageFa: 'در حال انتقال به درگاه پرداخت…',
    };
  }

  // ---------- تایید پرداخت (callback) ----------
  async verify(paymentId: string, authority?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { subscription: true },
    });
    if (!payment) throw new NotFoundException('تراکنش یافت نشد');
    if (payment.paidAt) return { ok: true, messageFa: 'این تراکنش قبلاً تایید شده است' };

    if (payment.gateway === 'mock') {
      await this.activate(payment.id, 'MOCK');
      return { ok: true, messageFa: 'پرداخت آزمایشی تایید شد' };
    }

    const res = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merchant_id: this.merchantId,
        amount: Number(payment.amountRial),
        authority: authority ?? payment.refId,
      }),
    });
    const data = (await res.json()) as { data?: { code?: number; ref_id?: number } };
    if (data?.data?.code === 100 || data?.data?.code === 101) {
      await this.activate(payment.id, String(data.data.ref_id ?? ''));
      return { ok: true, messageFa: 'پرداخت با موفقیت تایید شد؛ اشتراک شما فعال است' };
    }
    return { ok: false, messageFa: 'پرداخت ناموفق بود یا لغو شد' };
  }

  private async activate(paymentId: string, refId: string) {
    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { paidAt: new Date(), refId },
    });
    await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        endsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // یک ماه
      },
    });
  }

  mySubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { startsAt: 'desc' },
      include: { payments: true },
    });
  }
}
