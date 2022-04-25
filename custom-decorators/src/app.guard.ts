import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UserModel } from './model/user.model';

@Injectable()
export class AppGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();

    // hard coding으로 requestBody에 User 정보를 심어주겠다.  
    // Request를 가져올 때 제네릭으로 type을 지정하게 되면 req.user에 user를 넣어줄 수 없다.
    // const req = ctx.getRequest<Request>();
    const req = ctx.getRequest();

    const user: UserModel = {
      name: "leewoooo",
      email: "leewoooo.dev@gmail.com"
    }
    req.user = user;

    return true;
  }
}
