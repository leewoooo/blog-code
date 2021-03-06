import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserModel } from './model/user.model';

@Injectable()
export class AppGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest();
    req.user = new UserModel("leewoooo", "leewoooo.dev@gmail.com")

    return true;
  }
}
