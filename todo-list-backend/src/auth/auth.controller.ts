import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto, CreateUserDto, ResetPasswordDto, ChangePasswordDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('/signup')
    signUp(
        @Body(ValidationPipe)
        createUserDto: CreateUserDto,
    ): Promise<void> {
        return this.authService.signUp(createUserDto);
    }

    @Post('/signin')
    signIn(
        @Body(ValidationPipe)
        authCredentialsDto: AuthCredentialsDto,
    ): Promise<{ accessToken: string }> {
        return this.authService.signIn(authCredentialsDto);
    }

    @Post('/forgot-password')
    forgotPassword(
        @Body(ValidationPipe)
        resetPasswordDto: ResetPasswordDto,
    ): Promise<void> {
        return this.authService.requestPasswordReset(resetPasswordDto);
    }

    @Post('/reset-password')
    resetPassword(
        @Body(ValidationPipe)
        changePasswordDto: ChangePasswordDto,
    ): Promise<void> {
        return this.authService.resetPassword(changePasswordDto.token, changePasswordDto.newPassword);
    }
}