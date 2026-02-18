
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Adjust path if needed

@Module({
    imports: [PrismaModule],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule { }
