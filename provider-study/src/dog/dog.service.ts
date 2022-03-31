import { Injectable } from "@nestjs/common";

@Injectable()
export class DogService{
 
  printDog(){
    console.log('Dog');
  }
}