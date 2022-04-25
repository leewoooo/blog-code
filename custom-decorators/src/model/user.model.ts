// interface로 DTO를 만들게 되면 class-validator 유효성 검사기를 사용할 수 없기 때문에 

import { IsString } from "class-validator";

// class로 지정한다.
export class UserModel {
  @IsString()
  name: string;

  @IsString()
  email: string;

  constructor(name: string, email: string) {
    this.name = name;
    this.email = email;
  }
}

export interface User {
  name: string;
  email: string;
}