import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Request, Response } from "express";
import { CustomHttpException } from "./custom.exception";

@Catch(CustomHttpException)
export class CustomHttpExceptionFilter implements ExceptionFilter<CustomHttpException> {
  catch(exception: CustomHttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    // 들어온 reuqest에 대한 정보를 가져올 수 있음.
    const request = ctx.getRequest<Request>();
    console.log(request);

    // 사용자에게 보낼 Response를 커스텀 하기 위하여 Response를 얻어올 수 있음.
    const response = ctx.getResponse<Response>();
    console.log(response);

    const status = exception.getStatus();
    console.log(status);

    response
      .status(status)
      .send({
        'error': 'custom Exception filter 적용'
      });
  }
}