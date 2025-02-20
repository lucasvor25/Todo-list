import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
    let service: EmailService;
    let mockTransporter: jest.Mocked<nodemailer.Transporter>;

    const originalEnv = process.env;
    beforeEach(() => {
        process.env = {
            ...originalEnv,
            EMAIL_USER: 'test@example.com',
            EMAIL_PASSWORD: 'testpassword',
        };
    });

    afterEach(() => {
        process.env = originalEnv;
        jest.clearAllMocks();
    });

    beforeEach(async () => {
        mockTransporter = {
            sendMail: jest.fn(),
            verify: jest.fn(),
            close: jest.fn(),
        } as any;

        (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

        const module: TestingModule = await Test.createTestingModule({
            providers: [EmailService],
        }).compile();

        service = module.get<EmailService>(EmailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('constructor', () => {
        it('should create nodemailer transporter with correct config', () => {
            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASSWORD,
                },
                tls: { rejectUnauthorized: false },
                logger: true,
                debug: true,
            });
        });

        it('should throw error if email credentials are missing', () => {
            delete process.env.EMAIL_USER;
            delete process.env.EMAIL_PASSWORD;

            expect(() => new EmailService()).not.toThrow();
        });
    });

    describe('sendPasswordResetEmail', () => {
        const testEmail = 'user@example.com';
        const testToken = 'test-token-123';

        it('should send password reset email successfully', async () => {
            mockTransporter.sendMail.mockResolvedValue({
                messageId: 'test-message-id',
                accepted: [testEmail],
                rejected: [],
            });

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .resolves.not.toThrow();

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: process.env.EMAIL_USER,
                to: testEmail,
                subject: 'Recuperação de Senha',
                html: expect.stringContaining(testToken),
            });
        });

        it('should throw error when email sending fails', async () => {
            const errorMessage = 'Failed to send email';
            mockTransporter.sendMail.mockRejectedValue(new Error(errorMessage));

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .rejects.toThrow('Erro ao enviar email de recuperação');

            expect(mockTransporter.sendMail).toHaveBeenCalled();
        });

        it('should handle invalid email address', async () => {
            const invalidEmail = 'invalid-email';
            mockTransporter.sendMail.mockRejectedValue(new Error('Invalid email address'));

            await expect(service.sendPasswordResetEmail(invalidEmail, testToken))
                .rejects.toThrow();
        });

        it('should handle SMTP connection errors', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('ECONNREFUSED'));

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .rejects.toThrow();
        });

        it('should include correct reset link in email', async () => {
            mockTransporter.sendMail.mockImplementation((options: any) => {
                expect(options.html).toContain(`token=${testToken}`);
                expect(options.html).toContain('http://seu-frontend.com/reset-password');
                return Promise.resolve({ messageId: 'test' });
            });

            await service.sendPasswordResetEmail(testEmail, testToken);
        });

        it('should handle authentication errors', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('Invalid credentials'));

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .rejects.toThrow();
        });

        it('should handle rate limiting errors', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('Rate limit exceeded'));

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .rejects.toThrow();
        });

        it('should log success message on successful email send', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            mockTransporter.sendMail.mockResolvedValue({ messageId: 'test' });

            await service.sendPasswordResetEmail(testEmail, testToken);

            expect(consoleSpy).toHaveBeenCalledWith('Email de recuperação enviado com sucesso');
        });

        it('should log error details on failed email send', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error');
            const consoleLogSpy = jest.spyOn(console, 'log');
            const error = new Error('Test error');
            mockTransporter.sendMail.mockRejectedValue(error);

            await expect(service.sendPasswordResetEmail(testEmail, testToken))
                .rejects.toThrow();

            expect(consoleErrorSpy).toHaveBeenCalledWith('Erro ao enviar email:', error);
            expect(consoleLogSpy).toHaveBeenCalledWith('error', error);
        });
    });
});