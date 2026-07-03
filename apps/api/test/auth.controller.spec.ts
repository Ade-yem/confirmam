import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { BadRequestException } from '@nestjs/common';

describe('AuthController Validation', () => {
  let controller: AuthController;
  let mockAuthService: Partial<AuthService>;

  beforeEach(async () => {
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login validation', () => {
    it('should return detailed errors when email is invalid and password is empty', async () => {
      const promise = controller.login({
        email: 'not-an-email',
        password: '',
      });

      await expect(promise).rejects.toThrow(BadRequestException);

      try {
        await promise;
      } catch (err) {
        const error = err as BadRequestException;
        const response = error.getResponse() as { message: string[] };
        expect(response.message).toEqual(
          expect.arrayContaining([
            'email: Invalid email address',
            'password: Password is required',
          ]),
        );
      }
    });

    it('should return detailed error when body is empty/undefined', async () => {
      const promise = controller.login(
        undefined as unknown as Record<string, unknown>,
      );

      await expect(promise).rejects.toThrow(BadRequestException);

      try {
        await promise;
      } catch (err) {
        const error = err as BadRequestException;
        const response = error.getResponse() as { message: string[] };
        expect(Array.isArray(response.message)).toBe(true);
        expect(response.message[0]).toContain('received undefined');
      }
    });
  });

  describe('register validation', () => {
    it('should return detailed errors when inputs are missing/invalid', async () => {
      const promise = controller.register({
        businessName: '',
        email: 'invalid',
        password: '123',
      });

      await expect(promise).rejects.toThrow(BadRequestException);

      try {
        await promise;
      } catch (err) {
        const error = err as BadRequestException;
        const response = error.getResponse() as { message: string[] };
        expect(response.message).toEqual(
          expect.arrayContaining([
            'businessName: Business name is required',
            'email: Invalid email address',
            'password: Password must be at least 6 characters',
          ]),
        );
      }
    });
  });
});
