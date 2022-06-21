import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const options: MulterOptions = {
  dest: './upload',
};
function getMulterOptions(): MulterOptions {
  return {
    dest: './upload',
  };
}

@Controller()
export class AppController {
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

  @Post('/uploads2')
  @UseInterceptors(FileInterceptor('file', options))
  // @UseInterceptors(FileInterceptor('file', getMulterOptions))
  uploadFile2(@UploadedFile() file: Express.Multer.File) {
    console.log(file);
  }

  @Post('/uploads')
  @UseInterceptors(FilesInterceptor('files', 3))
  uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    console.log(files);
  }
}
