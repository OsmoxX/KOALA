import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTeamDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Nazwa drużyny jest wymagana.' })
  @MaxLength(100, { message: 'Nazwa drużyny może mieć najwyżej 100 znaków.' })
  name: string;

  @IsUUID('all', { message: 'Wybierz kategorię wiekową.' })
  categoryId: string;
}

export class UpdateTeamDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Nazwa drużyny jest wymagana.' })
  @MaxLength(100, { message: 'Nazwa drużyny może mieć najwyżej 100 znaków.' })
  name: string;
}

export class AddStudentDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Imię ucznia jest wymagane.' })
  @MaxLength(100, { message: 'Imię ucznia może mieć najwyżej 100 znaków.' })
  firstName: string;
}
