import { ArgumentMetadata, BadRequestException, Injectable, Logger, PipeTransform } from "@nestjs/common";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";

@Injectable()
export class ClassValidation implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // 사용자 정의 타입(class)이 들어오게 되면 해당하는 type과 value를 이용하여 object를 만든다.
    const object = plainToClass(metatype, value);

    // 만든 후 class에 있는 `class-validator` 데코레이터들이 붙어있는 프로퍼티들을 validate한다.
    const errors = await validate(object);

    // errors가 존재하면 BadRequestException을 발생시킨다.
    if (errors.length > 0) {
      // error의 상세 내용은 e.toString()을 찍으면 확인이 가능하다.
      errors.forEach((e) => console.log(e.toString()))
      throw new BadRequestException('Validation failed');
    }

    // 그렇지 않으면 value를 그대로 return한다.
    return value;
  }

  // 들어오는 value의 값의 metaType이 존재하는지 아닌지 validate하는 Function
  // 사용자정의타입 -> class의 metaType은 해당 Class Type으로 들어오게 된다.
  // 만약 현재 value로 CreateCatDto가 들어오면 metaType은 CreateCatDto가 된다.
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Number, Boolean, Array, Object];
    return !types.includes(metatype);
  }
}