import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  // https://docs.nestjs.com/fundamentals/execution-context#executioncontext-class
  canActivate(context: ExecutionContext,): boolean {
    const role = this.reflector.get<string>('role', context.getHandler());

    if (!role) {
      return false;
    }

    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();

    return role === req.header('role')
  }
}
