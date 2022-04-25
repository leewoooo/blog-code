import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

export const UserWithInterface = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);


