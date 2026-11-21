import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class SendMessageDto {
  // Trim first so a message of only spaces counts as empty.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 2000)
  body: string;
}
