import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class AppMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AppMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log('request가 들어왔습니다.')
    next();
  }
}
