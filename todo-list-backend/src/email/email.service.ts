import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
@Injectable()
export class EmailService {
    private transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
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
    }

    async sendPasswordResetEmail(email: string, token: string): Promise<void> {
        const resetLink = `http://seu-frontend.com/reset-password?token=${token}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperação de Senha',
            html: `
        <h1>Recuperação de Senha</h1>
        <p>Você solicitou a recuperação de senha.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href="${resetLink}">Redefinir Senha</a>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
        <p>O link expira em 1 hora.</p>
      `,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log('Email de recuperação enviado com sucesso');
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            console.log("error", error)
            throw new Error('Erro ao enviar email de recuperação');
        }
    }
}