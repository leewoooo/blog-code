import { Module } from "@nestjs/common";
import { UsersV1Controller } from "./users.controller";

@Module({
  controllers: [
    UsersV1Controller
  ]
})
export class UsersV1Moduel { }