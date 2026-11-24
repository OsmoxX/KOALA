import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_RULES } from './register-teacher.dto.js';

/** Te same zasady co przy rejestracji (NFR-02). */
function StrongPassword(): PropertyDecorator {
  return (target, key) => {
    IsString()(target, key);
    MinLength(8, { message: PASSWORD_RULES })(target, key);
    MaxLength(128, { message: PASSWORD_RULES })(target, key);
    Matches(/(?=.*[a-ząćęłńóśźż])(?=.*[A-ZĄĆĘŁŃÓŚŹŻ])(?=.*\d)/u, {
      message: PASSWORD_RULES,
    })(target, key);
  };
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Podaj aktualne hasło.' })
  @MaxLength(128)
  currentPassword: string;

  @StrongPassword()
  newPassword: string;
}

export class RequestPasswordResetDto {
  /** E-mail (nauczyciel) albo login ucznia. */
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Podaj e-mail albo login.' })
  @MaxLength(254)
  login: string;
}

export class PasswordResetTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  token: string;
}

export class ConfirmPasswordResetDto extends PasswordResetTokenDto {
  @StrongPassword()
  newPassword: string;
}
