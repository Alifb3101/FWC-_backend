import {
  BadRequestException,
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

export type SafeUser = Omit<User, 'password'>;

@Injectable()
export class AuthService {
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
      accessToken: await this.signToken(safeUser),
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
      accessToken: await this.signToken(safeUser),
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

  private async signToken(user: SafeUser): Promise<string> {
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

  private excludePassword(user: User): SafeUser {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
