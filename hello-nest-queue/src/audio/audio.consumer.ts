import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";

@Processor('audio')
export class AudioConsumer {

  @Process('foobar')
  // async printData(job: Job<제네릭으로 data 타입 설정 가능>) {
  async printData(job: Job) {
    const result = job.data
    console.log(`audio 메세지에 대한 수신 완료 id: ${job.id}, data: ${JSON.stringify(result)}`);
  }
}