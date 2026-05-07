import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService, GoogleUser } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Request } from 'express';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @CurrentUser('id') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth(@Query('redirect_uri') _redirectUri?: string) {
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @HttpCode(HttpStatus.OK)
  async googleAuthCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.googleLogin(req.user as GoogleUser);
    const redirectUri = typeof req.query.state === 'string' ? req.query.state : undefined;

    if (redirectUri && this.isAllowedRedirectUri(redirectUri)) {
      const url = new URL(redirectUri);
      url.searchParams.set('accessToken', tokens.accessToken);
      url.searchParams.set('refreshToken', tokens.refreshToken);
      url.searchParams.set('id', String(tokens.user.id ?? ''));
      url.searchParams.set('name', String(tokens.user.name ?? ''));
      url.searchParams.set('email', String(tokens.user.email ?? ''));
      url.searchParams.set('createdAt', String(tokens.user.createdAt ?? ''));
      url.searchParams.set('alertDaysBefore', String((tokens.user as any).alertDaysBefore ?? ''));
      res.redirect(url.toString());
      return;
    }

    return tokens;
  }

  private isAllowedRedirectUri(redirectUri: string): boolean {
    const allowedRedirectPrefixes = (
      this.configService.get<string>(
        'GOOGLE_ALLOWED_REDIRECT_PREFIXES',
        'mobile://,exp://,exps://,http://localhost,https://auth.expo.io,https://auth.expo.dev,https://expo.dev,https://estokar.vercel.app'
      )
    )
      .split(',')
      .map((prefix) => prefix.trim())
      .filter(Boolean);

    return allowedRedirectPrefixes.some((prefix) => redirectUri.startsWith(prefix));
  }
}
