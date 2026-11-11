import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Hasło jest wymagane.' })
  @MaxLength(128)
  password: string;
}
