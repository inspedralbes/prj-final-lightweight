import { Module } from '@nestjs/common';
import { RoutineController } from './routine.controller';
import { RoutineService } from './rotuine.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [RoutineController],
  providers: [RoutineService, PrismaService],
})
export class RoutineModule {}
