import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// El servicio de autenticación se encarga de manejar la lógica relacionada con el registro y el inicio de sesión de los usuarios.
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
    const { username, password, role = 'COACH' } = registerDto;
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });
    return { message: `User ${username} registered successfully` };
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
      // El token JWT se genera utilizando el servicio JwtService, que firma el payload con la clave secreta configurada en la aplicación.
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}
