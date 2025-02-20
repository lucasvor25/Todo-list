export class AuthCredentialsDto {
    email: string;
    password: string;
}

export class CreateUserDto {
    email: string;
    password: string;
}

export class ResetPasswordDto {
    email: string;
}

export class ChangePasswordDto {
    token: string;
    newPassword: string;
}
