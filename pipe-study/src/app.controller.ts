import { Body, Controller, Post } from "@nestjs/common";
import { IsString } from "class-validator";

class ForTest {
  @IsString()
  name: string
}

@Controller('apps')
export class AppController {

  @Post()
  testControllerLevelPipe(@Body() req: ForTest) {
    // ...
  }
}