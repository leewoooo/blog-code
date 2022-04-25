import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AppWithInterfaceGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = context.switchToHttp();

    const req = ctx.getRequest();
    req.user = {
      name: "leewoooo",
      email: "leewoooo.dev@gmail.com"
    }
    return true;
  }
}
