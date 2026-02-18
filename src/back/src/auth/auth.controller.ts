import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// El controlador de autenticación se encarga de manejar las solicitudes HTTP relacionadas con el registro y el inicio de sesión de los usuarios.
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Endpoint para registrar un nuevo usuario. Recibe un DTO con el nombre de usuario y la contraseña, y llama al servicio de autenticación para crear el nuevo usuario.
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  // Endpoint para iniciar sesión. Recibe un DTO con el nombre de usuario y la contraseña, y llama al servicio de autenticación para validar las credenciales y generar un token JWT.
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }
}
