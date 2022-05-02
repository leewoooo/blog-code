import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class AudioService {
  constructor(@InjectQueue('audio') private readonly audioQueue: Queue) { }


  async enQueue(data: string): Promise<void> {
    await this.audioQueue.add('foobar',
      {
        foo: data
      },
      // {
      //   delay: 3000,
      // },
    );
  }
}
