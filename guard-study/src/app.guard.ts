import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { NextFunction, Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class AppGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest<Request>();

    // 만약 여기서 응답에 대한 커스텀을 하고 싶다면 새로운 Exception을 터트려서 예외 filter에서 핸들링을 해라.
    return req.header('x-leewoooo') ? true : false
  }
}
