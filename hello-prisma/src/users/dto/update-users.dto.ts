import { IsNotEmpty, IsString } from "class-validator";

export class UpdateUsersRequest {
  @IsNotEmpty()
  @IsString()
  name: string;
}