import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  // Función para hashear la contraseña del usuario utilizando bcrypt.
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Función para validar la contraseña ingresada por el usuario comparándola con el hash almacenado en la base de datos.
  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Función para registrar un nuevo usuario. Verifica si el nombre de usuario ya existe, hashea la contraseña y crea un nuevo registro en la base de datos.
  async register(registerDto: RegisterDto) {
    const { username, email, password, role } = registerDto;
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }
    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
      },
    });
    return { message: `User ${user.username} registered successfully` };
  }

  // Función para iniciar sesión. Verifica si el usuario existe, valida la contraseña y genera un token JWT si las credenciales son correctas.
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await this.validatePassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { userId: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        coachId: user.coachId || undefined,
      },
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new NotFoundException('Email not registered');

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const rawToken = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const expiryMinutes = parseInt(
      this.config.get<string>('RESET_TOKEN_EXPIRY_MINUTES') ?? '30',
      10,
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { token: hash, userId: user.id, expiresAt },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    await this.mail.sendPasswordReset(
      user.email,
      `${frontendUrl}/reset-password?token=${rawToken}`,
    );
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hash = createHash('sha256').update(dto.token).digest('hex');
    const record = await this.prisma.passwordResetToken.findFirst({
      where: { token: hash, used: false, expiresAt: { gt: new Date() } },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    });
  }
}
