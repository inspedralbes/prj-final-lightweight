
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(username);
        if (user && (await bcrypt.compare(pass, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const payload = { username: user.username, sub: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersService.findOne(registerDto.username);
        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(registerDto.password, salt);

        const newUser = await this.usersService.create({
            username: registerDto.username,
            passwordHash,
            // role defaults to COACH as per schema
        });

        const { passwordHash: _, ...result } = newUser;
        return result;
    }
}
