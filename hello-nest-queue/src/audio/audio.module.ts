import { Module } from '@nestjs/common';
import { AudioService } from './audio.service';
import { AudioController } from './audio.controller';
import { BullModule } from '@nestjs/bull';
import { AudioConsumer } from './audio.consumer';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
        password: 'password'
      }
    }),
    BullModule.registerQueue({
      name: 'audio',
    }),
  ],
  providers: [AudioService, AudioConsumer],
  controllers: [AudioController]
})
export class AudioModule { }
