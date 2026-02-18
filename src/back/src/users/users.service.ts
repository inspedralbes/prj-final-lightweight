
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path as needed
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(username: string): Promise<User | null> {
        return this.prisma.client.user.findUnique({
            where: { username },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.client.user.create({
            data,
        });
    }
}
