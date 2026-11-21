import { IsString, Length } from 'class-validator';

export class CreateProfileDto {
    @IsString()
    @Length(3, 100)
    name: string;

    @IsString()
    @Length(1, 1000)
    description: string;
}
