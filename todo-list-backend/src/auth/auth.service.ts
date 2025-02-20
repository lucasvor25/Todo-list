import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { AuthCredentialsDto, CreateUserDto, ResetPasswordDto } from './dto/auth.dto';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService,
        private emailService: EmailService,
    ) { }

    async signUp(createUserDto: CreateUserDto): Promise<void> {

        const { email, password } = createUserDto;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({ email, password: hashedPassword });
        await this.userRepository.save(user);
    }

    async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string, userId: number }> {
        const { email, password } = authCredentialsDto;
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Agora o token contém o `id`
        const payload = { id: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload);

        return { accessToken, userId: user.id };
    }


    // async signIn(authCredentialsDto: AuthCredentialsDto): Promise<{ accessToken: string }> {
    //     const { email, password } = authCredentialsDto;
    //     const user = await this.userRepository.findOne({ where: { email } });

    //     if (!user || !(await bcrypt.compare(password, user.password))) {
    //         throw new UnauthorizedException('Invalid credentials');
    //     }

    //     const payload = { email };
    //     const accessToken = this.jwtService.sign(payload);
    //     return { accessToken };
    // }

    async requestPasswordReset(resetPasswordDto: ResetPasswordDto): Promise<void> {
        const { email } = resetPasswordDto;
        const user = await this.userRepository.findOne({ where: { email } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const resetToken = uuidv4();
        user.resetPasswordToken = resetToken;
        await this.userRepository.save(user);

        await this.emailService.sendPasswordResetEmail(email, resetToken);
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { resetPasswordToken: token } });

        if (!user) {
            throw new UnauthorizedException('Invalid token');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        await this.userRepository.save(user);
    }
}