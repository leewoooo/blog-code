import { Controller, Get, Optional } from '@nestjs/common';
import { DogService } from 'src/dog/dog.service';

@Controller('cat')
export class CatController {
    constructor(@Optional() private readonly dogService: DogService){}

    @Get()
    printDog(){
        this.dogService.printDog();
    }
}
