import { Controller, Post } from '@nestjs/common';
import { AudioService } from './audio.service';

@Controller('audio')
export class AudioController {
  constructor(private readonly audioService: AudioService) { }

  @Post()
  addData() {
    const data = 'foobar'
    this.audioService.enQueue(data);
  }
}
