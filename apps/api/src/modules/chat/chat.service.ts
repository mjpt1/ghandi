import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  /** طرف‌های قابل گفتگو: بیمار → پزشکان تاییدشده، پزشک → بیماران */
  async partners(userId: string, role: string) {
    if (role === Role.PATIENT) {
      const doctors = await this.prisma.doctor.findMany({
        where: { isVerified: true, user: { isActive: true } },
        include: { user: { select: { id: true, fullName: true } } },
        take: 50,
      });
      return doctors.map((d) => ({
        userId: d.user.id,
        fullName: d.user.fullName,
        subtitle: d.specialty,
      }));
    }
    const patients = await this.prisma.patient.findMany({
      where: { user: { isActive: true } },
      include: { user: { select: { id: true, fullName: true } } },
      take: 200,
    });
    return patients.map((p) => ({
      userId: p.user.id,
      fullName: p.user.fullName,
      subtitle: 'بیمار',
    }));
  }

  /** ایجاد یا یافتن مکالمه بین بیمار و پزشک */
  async getOrCreate(userId: string, role: string, partnerUserId: string) {
    const patientUserId = role === Role.PATIENT ? userId : partnerUserId;
    const doctorUserId = role === Role.PATIENT ? partnerUserId : userId;

    return this.prisma.conversation.upsert({
      where: { patientUserId_doctorUserId: { patientUserId, doctorUserId } },
      update: {},
      create: { patientUserId, doctorUserId },
    });
  }

  /** لیست مکالمات کاربر با آخرین پیام و تعداد نخوانده */
  async myConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ patientUserId: userId }, { doctorUserId: userId }] },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const result = [];
    for (const c of convs) {
      const partnerId = c.patientUserId === userId ? c.doctorUserId : c.patientUserId;
      const [partner, unread] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, fullName: true, role: true },
        }),
        this.prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
        }),
      ]);
      result.push({
        id: c.id,
        partner,
        lastMessage: c.messages[0] ?? null,
        unread,
      });
    }
    return result.sort(
      (a, b) =>
        (b.lastMessage ? +new Date(b.lastMessage.createdAt) : 0) -
        (a.lastMessage ? +new Date(a.lastMessage.createdAt) : 0),
    );
  }

  private async assertMember(conversationId: string, userId: string) {
    const c = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!c) throw new NotFoundException('مکالمه یافت نشد');
    if (c.patientUserId !== userId && c.doctorUserId !== userId) {
      throw new ForbiddenException('دسترسی به این مکالمه مجاز نیست');
    }
    return c;
  }

  /** پیام‌های مکالمه + علامت‌گذاری خوانده‌شده */
  async messages(conversationId: string, userId: string) {
    await this.assertMember(conversationId, userId);
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  /** ارسال پیام + تحویل بلادرنگ به طرف مقابل */
  async send(conversationId: string, userId: string, body: string) {
    const c = await this.assertMember(conversationId, userId);
    const msg = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body },
    });
    const partnerId = c.patientUserId === userId ? c.doctorUserId : c.patientUserId;
    this.realtime.emitToUser(partnerId, 'chat:message', msg);
    return msg;
  }
}
