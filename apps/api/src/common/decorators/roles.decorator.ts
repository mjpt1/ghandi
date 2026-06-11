import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
/** محدودکردن مسیر به نقش‌های مشخص — RBAC */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
