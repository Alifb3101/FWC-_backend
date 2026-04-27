import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService, type SafeUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminLoginDto } from './dto/admin-login.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto): Promise<{ accessToken: string; user: SafeUser }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    return this.authService.login(loginDto);
  }

  @Post('admin/login')
  adminLogin(
    @Body() loginDto: AdminLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    return this.authService.adminLogin(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: SafeUser, @Body() body: LogoutDto): Promise<{ success: true }> {
    await this.authService.logout(user.id, body.refreshToken);
    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: SafeUser): Promise<SafeUser> {
    return this.authService.getProfile(user.id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@CurrentUser() user: SafeUser): Promise<SafeUser> {
    return this.authService.getProfile(user.id);
  }
}
