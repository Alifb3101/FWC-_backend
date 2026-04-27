import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { compare, hash } from 'bcrypt';
import { Role, type User } from '@prisma/client';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { AdminLoginDto } from './dto/admin-login.dto';

export type SafeUser = Omit<User, 'password'>;
type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  private readonly adminLoginAttempts = new Map<
    string,
    { count: number; windowStart: number }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ accessToken: string; user: SafeUser }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const hashedPassword = await hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: registerDto.firstName.trim(),
        lastName: registerDto.lastName.trim(),
        phone: registerDto.phone?.trim(),
        role: Role.CUSTOMER,
      },
    });

    await this.prisma.cart.create({
      data: {
        userId: user.id,
      },
    });

    const safeUser = this.excludePassword(user);

    return {
      accessToken: await this.signAccessToken(safeUser),
      user: safeUser,
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = this.excludePassword(user);

    return {
      accessToken: await this.signAccessToken(safeUser),
      user: safeUser,
    };
  }

  async adminLogin(
    loginDto: AdminLoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
    const email = loginDto.email.toLowerCase().trim();
    this.assertAdminLoginNotRateLimited(email);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      this.recordFailedAdminLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.recordFailedAdminLogin(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!this.isAdminRole(user.role)) {
      this.recordFailedAdminLogin(email);
      throw new ForbiddenException('Admin access is required');
    }

    this.clearAdminLoginAttempts(email);

    const safeUser = this.excludePassword(user);
    const tokens = await this.issueTokens(safeUser);

    return {
      ...tokens,
      user: safeUser,
    };
  }

  async getProfile(userId: number): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found');
    }

    return this.excludePassword(user);
  }

  async validateJwtUser(userId: number): Promise<SafeUser> {
    return this.getProfile(userId);
  }

  async logout(userId: number, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const activeTokens = await this.prisma.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
        },
        select: {
          id: true,
          tokenHash: true,
        },
      });

      for (const tokenRecord of activeTokens) {
        const isMatch = await compare(refreshToken, tokenRecord.tokenHash);
        if (isMatch) {
          await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }
  }

  private async issueTokens(user: SafeUser): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user),
    ]);

    await this.persistRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async signAccessToken(user: SafeUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const options: JwtSignOptions = {
      secret: this.configService.getOrThrow<string>('auth.jwtSecret'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'auth.jwtExpiresIn',
      ),
    };

    return this.jwtService.signAsync(payload, options);
  }

  private async signRefreshToken(user: SafeUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const options: JwtSignOptions = {
      secret: this.configService.getOrThrow<string>('auth.refreshTokenSecret'),
      expiresIn: this.configService.getOrThrow<JwtSignOptions['expiresIn']>(
        'auth.refreshTokenExpiresIn',
      ),
    };

    return this.jwtService.signAsync(payload, options);
  }

  private async persistRefreshToken(userId: number, rawToken: string): Promise<void> {
    const refreshTokenTtl = this.configService.getOrThrow<string>('auth.refreshTokenExpiresIn');
    const expiresAt = new Date(Date.now() + this.durationToMs(refreshTokenTtl));

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: await hash(rawToken, 10),
        expiresAt,
      },
    });
  }

  private durationToMs(value: string): number {
    const normalized = value.trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      return Number(normalized) * 1000;
    }

    const match = normalized.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000;
    }

    const amount = Number(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return amount * 1000;
      case 'm':
        return amount * 60 * 1000;
      case 'h':
        return amount * 60 * 60 * 1000;
      case 'd':
        return amount * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private isAdminRole(role: Role): boolean {
    return role === Role.SUPER_ADMIN || role === Role.ADMIN || role === Role.STAFF;
  }

  private assertAdminLoginNotRateLimited(email: string): void {
    const current = this.adminLoginAttempts.get(email);

    if (!current) {
      return;
    }

    const now = Date.now();
    const windowMs = 15 * 60 * 1000;

    if (now - current.windowStart > windowMs) {
      this.adminLoginAttempts.delete(email);
      return;
    }

    if (current.count >= 5) {
      throw new HttpException('Too many failed login attempts. Try again later.', 429);
    }
  }

  private recordFailedAdminLogin(email: string): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const current = this.adminLoginAttempts.get(email);

    if (!current || now - current.windowStart > windowMs) {
      this.adminLoginAttempts.set(email, { count: 1, windowStart: now });
      return;
    }

    this.adminLoginAttempts.set(email, {
      count: current.count + 1,
      windowStart: current.windowStart,
    });
  }

  private clearAdminLoginAttempts(email: string): void {
    this.adminLoginAttempts.delete(email);
  }

  private excludePassword(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
