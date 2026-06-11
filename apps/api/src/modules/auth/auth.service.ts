import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // ---------- ثبت‌نام ----------
  async register(dto: RegisterDto, ip?: string, userAgent?: string) {
    const exists = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (exists) throw new ConflictException('این شماره قبلاً ثبت شده است');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const role = dto.role === 'DOCTOR' ? Role.DOCTOR : Role.PATIENT;

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        fullName: dto.fullName,
        passwordHash,
        role,
        // پروفایل بیمار به‌صورت خودکار ساخته می‌شود؛ پزشک پس از تایید مدارک
        ...(role === Role.PATIENT ? { patient: { create: {} } } : {}),
      },
      include: { patient: true, doctor: true },
    });

    await this.audit(user.id, 'REGISTER', ip, userAgent);
    return this.issueTokens(user.id, user.role, user.patient?.id, user.doctor?.id);
  }

  // ---------- ورود ----------
  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { patient: true, doctor: true },
    });
    // پیام یکسان برای جلوگیری از user enumeration
    const invalid = new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    if (!user || !user.isActive) throw invalid;

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.audit(user.id, 'LOGIN_FAILED', ip, userAgent);
      throw invalid;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await this.audit(user.id, 'LOGIN', ip, userAgent);
    return this.issueTokens(user.id, user.role, user.patient?.id, user.doctor?.id);
  }

  // ---------- تمدید توکن ----------
  async refresh(refreshToken: string) {
    const tokenHash = sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { patient: true, doctor: true } } },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('نشست منقضی شده؛ دوباره وارد شوید');
    }
    // Rotation: توکن قبلی باطل می‌شود
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const u = stored.user;
    return this.issueTokens(u.id, u.role, u.patient?.id, u.doctor?.id);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken) },
      data: { revokedAt: new Date() },
    });
    return { message: 'با موفقیت خارج شدید' };
  }

  // ---------- صدور توکن‌ها ----------
  private async issueTokens(userId: string, role: Role, patientId?: string, doctorId?: string) {
    const payload = { sub: userId, role, patientId, doctorId };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL ?? '15m',
    });

    const refreshToken = randomBytes(48).toString('hex');
    const days = parseInt(process.env.JWT_REFRESH_TTL ?? '30', 10);
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: sha256(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + days * 24 * 3600 * 1000),
      },
    });

    return { accessToken, refreshToken, role };
  }

  private audit(userId: string, action: string, ip?: string, userAgent?: string) {
    return this.prisma.auditLog.create({ data: { userId, action, ip, userAgent } });
  }
}
