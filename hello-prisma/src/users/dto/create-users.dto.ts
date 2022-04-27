import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateUsersRequest {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}