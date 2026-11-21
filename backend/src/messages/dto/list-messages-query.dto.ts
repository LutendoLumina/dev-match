import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class ListMessagesQueryDto {
  /** Only return messages sent at or after this time (used for polling). */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since?: Date;
}
