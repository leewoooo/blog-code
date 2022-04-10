import { HttpException, HttpStatus } from "@nestjs/common";

export class CustomHttpException extends HttpException {
  // 여기서 생성자로 미리 정의해둔 상수 혹은 객체를 받아 부모의 생성자에 넣어준다.
  constructor(response: string | Record<string, any>, status: HttpStatus) {
    super(response, status);
  }
}