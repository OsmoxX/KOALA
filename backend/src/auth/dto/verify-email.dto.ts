import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}

export class ResendVerificationDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  email: string;
}
