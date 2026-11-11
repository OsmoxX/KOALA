import { Transform } from 'class-transformer';
import {
  Equals,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const PASSWORD_RULES =
  'Hasło musi mieć 8–128 znaków i zawierać małą literę, wielką literę oraz cyfrę.';

export class RegisterTeacherDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8, { message: PASSWORD_RULES })
  @MaxLength(128, { message: PASSWORD_RULES })
  @Matches(/(?=.*[a-ząćęłńóśźż])(?=.*[A-ZĄĆĘŁŃÓŚŹŻ])(?=.*\d)/u, {
    message: PASSWORD_RULES,
  })
  password: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Imię jest wymagane.' })
  @MaxLength(100)
  firstName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Nazwisko jest wymagane.' })
  @MaxLength(100)
  lastName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Nazwa szkoły jest wymagana.' })
  @MaxLength(200)
  schoolName: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Miejscowość szkoły jest wymagana.' })
  @MaxLength(100)
  schoolCity: string;

  /** Akceptacja regulaminu i informacji o przetwarzaniu danych (FR-07). */
  @Equals(true, {
    message: 'Wymagana jest akceptacja regulaminu i informacji RODO.',
  })
  acceptTerms: boolean;
}
