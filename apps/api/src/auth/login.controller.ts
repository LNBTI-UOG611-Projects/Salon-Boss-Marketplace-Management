import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Public } from './decorators';
import { LoginService } from './login.service';

export class LoginDto {
  @ApiProperty({ example: '0774829180', description: 'Mobile number or username (email sign-in uses Supabase directly)' })
  @IsString()
  @Length(3, 120)
  identifier: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  password: string;
}

@ApiTags('auth')
@Controller('auth')
export class LoginController {
  constructor(private readonly logins: LoginService) {}

  /** Returns Supabase session tokens; the browser stores them with supabase.auth.setSession. */
  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.logins.login(dto.identifier, dto.password);
  }
}
