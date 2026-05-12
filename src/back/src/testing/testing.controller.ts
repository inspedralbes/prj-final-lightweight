import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  TestingService,
  type ResetResult,
  type SeedSnapshot,
} from './testing.service';
import { LoginAsDto } from './dto/login-as.dto';
import { InjectResetTokenDto } from './dto/inject-reset-token.dto';

@SkipThrottle()
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

  @Post('inject-reset-token')
  @HttpCode(HttpStatus.OK)
  async injectResetToken(
    @Body() dto: InjectResetTokenDto,
  ): Promise<{ rawToken: string }> {
    return this.testing.injectResetToken(dto.email);
  }
}
