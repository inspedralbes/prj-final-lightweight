import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  TestingService,
  type ResetResult,
  type SeedSnapshot,
} from './testing.service';
import { LoginAsDto } from './dto/login-as.dto';

@Controller('testing')
export class TestingController {
  constructor(private readonly testing: TestingService) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset(): Promise<ResetResult> {
    return this.testing.reset();
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seed(): Promise<{ seeded: SeedSnapshot }> {
    const seeded = await this.testing.seed();
    return { seeded };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginAsDto) {
    return this.testing.loginAs(dto.username);
  }
}
