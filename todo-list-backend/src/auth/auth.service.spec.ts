import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
    let authService: AuthService;
    let userRepository: Repository<User>;
    let jwtService: JwtService;
    let emailService: EmailService;

    const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword123',
        resetPasswordToken: null,
    };

    const mockUserRepository = {
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    const mockEmailService = {
        sendPasswordResetEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepository,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: EmailService,
                    useValue: mockEmailService,
                },
            ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userRepository = module.get<Repository<User>>(getRepositoryToken(User));
        jwtService = module.get<JwtService>(JwtService);
        emailService = module.get<EmailService>(EmailService);

        jest.clearAllMocks();
        jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword123'));
        jest.spyOn(bcrypt, 'compare').mockImplementation((plain, hashed) => Promise.resolve(plain === 'correctPassword'));
    });

    describe('signUp', () => {
        const signUpDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should successfully create a new user', async () => {
            mockUserRepository.create.mockReturnValue(mockUser);
            mockUserRepository.save.mockResolvedValue(mockUser);

            await expect(authService.signUp(signUpDto)).resolves.not.toThrow();

            expect(mockUserRepository.create).toHaveBeenCalledWith({
                email: signUpDto.email,
                password: 'hashedPassword123',
            });
            expect(mockUserRepository.save).toHaveBeenCalled();
        });

        it('should handle MySQL duplicate entry error', async () => {
            const mysqlError = new Error('ER_DUP_ENTRY');
            mockUserRepository.save.mockRejectedValue(mysqlError);

            await expect(authService.signUp(signUpDto)).rejects.toThrow();
        });
    });

    describe('signIn', () => {
        const signInDto = {
            email: 'test@example.com',
            password: 'correctPassword',
        };

        it('should return access token for valid credentials', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockJwtService.sign.mockReturnValue('mockAccessToken');

            const result = await authService.signIn(signInDto);

            expect(result).toEqual({ accessToken: 'mockAccessToken' });
            expect(mockJwtService.sign).toHaveBeenCalledWith({ email: signInDto.email });
        });

        it('should throw UnauthorizedException for invalid email', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(authService.signIn(signInDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            const wrongPasswordDto = { ...signInDto, password: 'wrongPassword' };

            await expect(authService.signIn(wrongPasswordDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should handle MySQL connection errors', async () => {
            mockUserRepository.findOne.mockRejectedValue(new Error('ER_CON_COUNT_ERROR'));

            await expect(authService.signIn(signInDto)).rejects.toThrow();
        });
    });

    describe('requestPasswordReset', () => {
        const resetDto = {
            email: 'test@example.com',
        };

        it('should generate reset token and send email', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockUserRepository.save.mockResolvedValue({ ...mockUser, resetPasswordToken: 'newToken' });
            mockEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

            await authService.requestPasswordReset(resetDto);

            expect(mockUserRepository.save).toHaveBeenCalled();
            expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
                resetDto.email,
                expect.any(String)
            );
        });

        it('should throw UnauthorizedException for non-existent user', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(authService.requestPasswordReset(resetDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should handle email service errors', async () => {
            mockUserRepository.findOne.mockResolvedValue(mockUser);
            mockEmailService.sendPasswordResetEmail.mockRejectedValue(new Error('Email service error'));

            await expect(authService.requestPasswordReset(resetDto)).rejects.toThrow();
        });
    });

    describe('resetPassword', () => {
        const resetToken = 'validToken';
        const newPassword = 'newPassword123';

        it('should successfully reset password', async () => {
            const userWithToken = { ...mockUser, resetPasswordToken: resetToken };
            mockUserRepository.findOne.mockResolvedValue(userWithToken);
            mockUserRepository.save.mockResolvedValue({ ...userWithToken, resetPasswordToken: null });

            await authService.resetPassword(resetToken, newPassword);

            expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({
                password: 'hashedPassword123',
                resetPasswordToken: null,
            }));
        });

        it('should throw UnauthorizedException for invalid token', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow(UnauthorizedException);
        });

        it('should handle MySQL update errors', async () => {
            const userWithToken = { ...mockUser, resetPasswordToken: resetToken };
            mockUserRepository.findOne.mockResolvedValue(userWithToken);
            mockUserRepository.save.mockRejectedValue(new Error('ER_ERROR_ON_WRITE'));

            await expect(authService.resetPassword(resetToken, newPassword)).rejects.toThrow();
        });
    });
});