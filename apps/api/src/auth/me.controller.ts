import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { MeDto } from '@bossone/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './auth-user';
import { CurrentUser } from './decorators';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the signed-in user with roles and permissions. Web and mobile call this after login. */
  @Get()
  async me(@CurrentUser() user: AuthUser): Promise<MeDto> {
    const record = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { customerProfile: { select: { preferredLanguage: true } } },
    });
    return {
      id: record.id,
      email: record.email,
      phone: record.phone,
      fullName: record.fullName,
      userType: record.userType,
      status: record.status,
      roles: user.roles,
      permissions: [...user.permissions],
      preferredLanguage: record.userType === 'CUSTOMER' ? (record.customerProfile?.preferredLanguage ?? 'en') : null,
    };
  }
}
