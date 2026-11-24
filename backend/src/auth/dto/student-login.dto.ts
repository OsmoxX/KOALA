import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StudentLoginDto {
  /** Login ucznia – wielkość liter nie ma znaczenia. */
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'Login jest wymagany.' })
  @MaxLength(64)
  login: string;

  @IsString()
  @IsNotEmpty({ message: 'Hasło jest wymagane.' })
  @MaxLength(128)
  password: string;
}
