import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

// interceptor는 @Injectable 데코레이터를 이용하며 NestInterceptor를 구현한 class이다.
// 첫번째 파라미터로 받는 ExecutionContext는 가드에서 사용했던 실행 컨텍스트와 완전이 동일한 것이다.
// 두번째 인자로 들어오는 CallHandler는 handle()이라는 메소드를 가진 인터페이스이다. 제네릭을 지정할 수 있다.
// 해당 메소드 위로는 라우트 핸들러가 실행되기 전이고 아래로는 라우트 핸들러가 실행 된 이후 이다.
@Injectable()
export class AppInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 핸들러 실행 전
    // console.log('request: ', request);
    console.log('라우트 핸들러가 실행되기 전 입니다.');

    const result = next.handle();

    // 핸들러 실행 후
    // console.log('response: ', response);
    console.log('라우트 핸들러가 실행되기 후 입니다.');
    return result;
  }
}
