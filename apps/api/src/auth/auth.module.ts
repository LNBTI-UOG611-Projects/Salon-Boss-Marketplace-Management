import { Global, Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { MeController } from './me.controller';
import { SupabaseJwtService } from './supabase-jwt.service';
import { UsersService } from './users.service';

@Global()
@Module({
  controllers: [MeController, LoginController],
  providers: [SupabaseJwtService, UsersService, LoginService],
  exports: [SupabaseJwtService, UsersService],
})
export class AuthModule {}
