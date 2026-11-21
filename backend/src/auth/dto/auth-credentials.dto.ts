import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

/** Body for both POST /auth/register and POST /auth/login. */
export class AuthCredentialsDto {
  // Normalise so "Me@Example.com " and "me@example.com" are the same account.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @MaxLength(254)
  email: string;

  // bcrypt only uses the first 72 bytes of a password, so cap it there.
  @IsString()
  @Length(8, 72)
  password: string;
}
