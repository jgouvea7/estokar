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
  ) {}

  // ──────────────────────────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────────────────────────
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────────────────────────
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/refresh  (envia refresh token no header Authorization: Bearer <token>)
  // ──────────────────────────────────────────────────────────────
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @CurrentUser('id') userId: string,
    @CurrentUser('refreshToken') refreshToken: string,
  ) {
    return this.authService.refreshTokens(userId, refreshToken);
  }

  // ──────────────────────────────────────────────────────────────
  // POST /auth/logout
  // ──────────────────────────────────────────────────────────────
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/me
  // ──────────────────────────────────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/google  — redireciona para o Google
  // ──────────────────────────────────────────────────────────────
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  googleAuth(@Query('redirect_uri') _redirectUri?: string) {
    // O guard redireciona automaticamente para o Google
  }

  // ──────────────────────────────────────────────────────────────
  // GET /auth/google/callback  — callback após login no Google
  // ──────────────────────────────────────────────────────────────
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
      url.searchParams.set('access_token', tokens.access_token);
      url.searchParams.set('refresh_token', tokens.refresh_token);
      url.searchParams.set('id', String(tokens.user.id ?? ''));
      url.searchParams.set('name', String(tokens.user.name ?? ''));
      url.searchParams.set('email', String(tokens.user.email ?? ''));
      res.redirect(url.toString());
      return;
    }

    return tokens;
  }

  private isAllowedRedirectUri(redirectUri: string): boolean {
    const allowedRedirectPrefixes = (
      this.configService.get<string>('GOOGLE_ALLOWED_REDIRECT_PREFIXES', 'mobile://,exp://,http://localhost')
    )
      .split(',')
      .map((prefix) => prefix.trim())
      .filter(Boolean);

    return allowedRedirectPrefixes.some((prefix) => redirectUri.startsWith(prefix));
  }
}
