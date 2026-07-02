import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, comparePassword } from '../common/utils/crypto';
import { randomBytes } from 'crypto';

/**
 * Service handling merchant authentication, password-based registration and login,
 * and Google OAuth2 credential verification and sign-in.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registers a new merchant with a business name, email, and hashed password.
   *
   * @param {string} businessName Name of the business.
   * @param {string} email Email address of the merchant.
   * @param {string} password Raw text password to be hashed.
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} The signed JWT and merchant profile.
   * @throws {BadRequestException} If the email is already in use.
   */
  async register(businessName: string, email: string, password: string): Promise<{ token: string; user: { email: string; name: string; }; }> {
    const existing = await this.prisma.merchant.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Merchant with this email already exists');
    }

    const hashed = await hashPassword(password);

    const merchant = await this.prisma.merchant.create({
      data: {
        email,
        passwordHash: hashed,
        name: businessName,
      },
    });

    const payload = { sub: merchant.id, email: merchant.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        email: merchant.email,
        name: merchant.name,
      },
    };
  }

  /**
   * Validates merchant credentials and signs a JWT for authentication.
   *
   * @param {string} email Email address of the merchant.
   * @param {string} password Raw text password to verify.
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} The signed JWT and merchant profile.
   * @throws {UnauthorizedException} If credentials do not match.
   */
  async login(email: string, password: string): Promise<{ token: string; user: { email: string; name: string; }; }> {
    const merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });
    if (!merchant) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matched = await comparePassword(password, merchant.passwordHash);
    if (!matched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: merchant.id, email: merchant.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        email: merchant.email,
        name: merchant.name,
      },
    };
  }

  /**
   * Generates the Google OAuth2 consent screen URL.
   *
   * @returns {string} The fully formed Google OAuth2 login URL.
   */
  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;

    if (!clientId || !redirectUri) {
      this.logger.error('Google OAuth credentials not configured in environment variables.');
      throw new BadRequestException('Google login is currently misconfigured.');
    }

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      clientId,
    )}&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&response_type=code&scope=email%20profile`;
  }

  /**
   * Exchanges Google authorization code for access token and retrieves merchant details.
   * Creates the merchant if they do not exist in the database.
   *
   * @param {string} code Authorization code received from Google callback.
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} The signed JWT and merchant details.
   */
  async handleGoogleCallback(code: string): Promise<{ token: string; user: { email: string; name: string; }; }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL}/auth/google/callback`;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google credentials misconfigured.');
    }

    try {
      // Exchange authorization code for token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        this.logger.error(`Google token exchange failed: ${errorText}`);
        throw new BadRequestException('Failed to exchange authorization code with Google.');
      }

      const tokenData = (await tokenResponse.json()) as { access_token: string };

      // Retrieve user info from Google
      const infoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!infoResponse.ok) {
        const errorText = await infoResponse.text();
        this.logger.error(`Google userinfo failed: ${errorText}`);
        throw new BadRequestException('Failed to retrieve user info from Google.');
      }

      const infoData = (await infoResponse.json()) as { email: string; name?: string };
      if (!infoData.email) {
        throw new BadRequestException('Google did not return email information.');
      }

      return this.findOrCreateGoogleMerchant(infoData.email, infoData.name || '');
    } catch (err) {
      this.logger.error('Google callback error occurred', err);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to complete Google Sign-In.');
    }
  }

  /**
   * Validates a Google ID Token (credential) directly against Google API.
   * Useful for frontend-initiated Google Identity Services flows.
   *
   * @param {string} idToken Google ID token sent from the client.
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} The signed JWT and merchant profile.
   */
  async googleLoginWithToken(idToken: string): Promise<{ token: string; user: { email: string; name: string; }; }> {
    try {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Google ID token verification failed: ${errorText}`);
        throw new UnauthorizedException('Invalid Google ID token');
      }

      const body = (await response.json()) as { email: string; name?: string };
      if (!body.email) {
        throw new BadRequestException('Google token does not contain email info');
      }

      return this.findOrCreateGoogleMerchant(body.email, body.name || 'Google User');
    } catch (err) {
      this.logger.error('Failed to verify Google ID token', err);
      if (err instanceof UnauthorizedException || err instanceof BadRequestException) throw err;
      throw new UnauthorizedException('Google ID token verification failed');
    }
  }

  /**
   * Simulates a mock Google login flow for sandbox/local testing.
   *
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} Mock JWT and profile.
   */
  async googleMockLogin(): Promise<{ token: string; user: { email: string; name: string; }; }> {
    return this.findOrCreateGoogleMerchant('google-user@confirmam.com', 'Google User');
  }

  /**
   * Finds a merchant by email or provisions a new one if not found.
   * Helper function for Google OAuth integrations.
   *
   * @private
   * @param {string} email Merchant email address.
   * @param {string} name Merchant business name.
   * @returns {Promise<{token: string, user: {email: string, name: string}}>} The login details.
   */
  private async findOrCreateGoogleMerchant(email: string, name: string): Promise<{ token: string; user: { email: string; name: string; }; }> {
    let merchant = await this.prisma.merchant.findUnique({
      where: { email },
    });

    if (!merchant) {
      const hashed = await hashPassword(randomBytes(16).toString('hex'));
      merchant = await this.prisma.merchant.create({
        data: {
          email,
          passwordHash: hashed,
          name: name,
        },
      });
    }

    const payload = { sub: merchant.id, email: merchant.email };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        email: merchant.email,
        name: merchant.name,
      },
    };
  }
}
