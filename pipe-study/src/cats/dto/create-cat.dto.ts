import { IsInt, IsString } from "class-validator";

export class CreateCatDto {
  @IsString()
  name: string;

  @IsInt()
  age: number;
}