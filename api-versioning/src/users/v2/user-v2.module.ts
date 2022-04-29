import { Module } from "@nestjs/common";
import { UsersV2Controller } from "./users.controller";

@Module({
  controllers: [
    UsersV2Controller
  ]
})
export class UsersV2Moduel { }