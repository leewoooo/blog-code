import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata) {
    console.log(`value: ${value}, type: ${typeof value}`);
    console.log(`metaData type: ${metadata.type}, value: ${metadata.data}, metaType: ${metadata.metatype}`);

    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
