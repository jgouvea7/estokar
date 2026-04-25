import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID_NOT_SET'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET_NOT_SET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', 'http://localhost:3000/auth/google/callback'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, displayName, emails, photos } = profile;
    const user = {
      googleId: id,
      name: displayName,
      email: emails?.[0]?.value,
      picture: photos?.[0]?.value,
    };
    done(null, user);
  }
}
