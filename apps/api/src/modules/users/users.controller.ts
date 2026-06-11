import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Roles(Role.ADMIN)
@Controller('admin')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('users')
  list(@Query('q') q?: string, @Query('role') role?: Role) {
    return this.users.list(q, role);
  }

  @Patch('users/:id/toggle')
  toggle(@CurrentUser() admin: JwtUser, @Param('id') id: string) {
    return this.users.toggleActive(id, admin.sub);
  }

  @Get('stats')
  stats() {
    return this.users.stats();
  }

  @Get('audit-logs')
  audit() {
    return this.users.auditLogs();
  }
}
