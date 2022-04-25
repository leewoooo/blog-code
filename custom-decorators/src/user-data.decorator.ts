import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserModel } from './model/user.model';

// createParamDecorator
// 데코레이터를 사용하는 곳에서 데이터를 넘겨준 것을 사용할 수 있다. createParamDecorator 뒤에 데코레이터를 이용하여
// 타입을 지정할 수 있다.
export const UserData = createParamDecorator<string>(
  (data: string, ctx: ExecutionContext): UserModel => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // 만약 인자로 들어오는 것이 있다면 user 객체에서 해당하는 인자에 대한 필드를 리턴
    // 인자가 없다면 user 객체를 그대로 return
    return data ? user?.[data] : user;
  }
)
