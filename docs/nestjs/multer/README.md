# NestJs에서 File Upload하기

## Goal

- multer를 사용해보자

- nestjs에서 file upload를 어떻게 처리할까?

<br>

## Multer

`Multer`는 `Node`진영에서 파일 업로드에 이용되는 대표적인 라이브러리다. `NestJs` 공식 문서에서도 파일 업로드를 처리하기 위해 `Express`용 `Multer` 미들웨어를 사용하여 설명하고 있다.

`NestJs`는 `typescript`기반이기 때문에 `Multer` 라이브러리의 `type` 관련 라이브러리를 추가하는 것으로 시작한다. (yarn을 기준으로 작성)

```zsh
yarn add @tyeps/multer -D
```

<br>

## Upload하기

### 단일 파일

단일 파일을 업로드 받을 때 `FileInterceptor()`를 이용하게 되며 파라미터는 2개를 받는다.

- `multipart/form-data`에서 `name`에 해당하는 값
- `Multer`의 Option을 받는다. ([Multer Option](https://github.com/expressjs/multer#multeropts))

```ts
@Post('/upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  console.log(file);
}
```

위와 같이 작성 후 해당 endpoint로 API호출을 하게 되면 아래와 같이 데이터가 들어온다.

```zsh
{
  fieldname: 'file',
  originalname: 'image.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: <Buffer ... 939900 more bytes>,
  size: 939950
}
```

<br>

### 다중 파일

단일파일과 크게 다르지 않지만 사용하는 `Interceptor`와 `ParameterDecorator`만 변경된다. 기존에는 단수형를 사용하였다면 **이제는 복수형을 사용하면 된다.**

`FilesInterceptor`를 이용할 때 두번 째 파라미터로 **업로드가 가능한 파일의 갯수를 제한할 수 있다.** 다른 옵션으로는 `FileFieldsInterceptor`를 사용할 수 있는데 `multipart/form-data`로 들어오는 `name`마다 `maxCount`를 부여할 수 있다.

마지막으로 `AnyFilesInterceptor`를 사용할 수 있는데 요청으로 들어오는 모든 `name`에 해당하는 파일을 받을 수 있게 된다.

```ts
@Post('/uploads')
@UseInterceptors(FilesInterceptor('files')) // FilesInterceptor
// @UseInterceptors(FilesInterceptor('files', 3)) // 업로드 파일을 3개로 제한
// @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 1 }])) // name 값이 files에 대한 limit
// @UseInterceptors(AnyFilesInterceptor()) // 모든 파일 받기
uploadFiles(@UploadedFiles() files: Array<Express.Multer.File>) { // UploadedFiles
  console.log(files);
}
```

위와 같이 작성 후 해당 endpoint로 API호출을 하게 되면 아래와 같이 데이터가 들어온다. 단일 업로드와 다른 점은 배열로 들어온다는 것이다.

```zsh
[
  {
    fieldname: 'files',
    originalname: 'image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: <Buffer ... 939900 more bytes>,
    size: 939950
  },
  {
    fieldname: 'files',
    originalname: 'knowledge_graph_logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: <Buffer ... 10020 more bytes>,
    size: 10070
  }
]
```

<br>

## 옵션

위에서 설명한 것과 같이 `FileInterceptor`의 두번째 파라미터로 옵션을 부여할 수 있다. (`FilesInterceptor`는 3번째 파라미터)

[Multer Option](https://github.com/expressjs/multer#multeropts)를 참조하면 자세히 볼 수 있다.

그 중 가장 기본 옵션인 `dest`요소는 `Multer`에게 파일을 어디로 업로드 할 지를 알려준다. 만일 Option을 생락하면 파일은 디스크가 아니라 **메모리에 저장된다.** 기본적으로 `Multer`는 **이름의 중복을 방지하기 위해 내부적으로 임의로 이름을 생성하며 확장자는 붙어있지 않게 된다.**

`Multer Option`은 아래와 같은 프로퍼티를 갖는다.

```ts
export interface MulterOptions {
  dest?: string;
  storage?: any;
  limits?: {...};
  preservePath?: boolean;
  fileFilter?(
    req: any,
    file: {...},
    callback: (error: Error | null, acceptFile: boolean) => void
  ): void;
}
```

<br>

### dest

`dest`를 지정하게 되면 지정된 위치에 업로드 된 파일이 저장이 되게 된다. 이 때 지정한 path에 디렉토리가 존재하지 않는다면 **자동적으로 생성이 된다.**

또한 확장자가 없는 상태에서 `Multer` 내부에서 임의로 생성한 이름으로 저장이 되게 된다. 위에서 이야기 했던 것처럼 **임의로 생성된 파일명에는 확장자가 붙어있지 않다.**

<br>

### storage

`dest`보다 조금 더 세밀하게 `upload`를 제어하고 싶을 때 사용할 수 있는 옵션이다. `storage`는 2가지가 존재한다. (현재 글은 disk storage를 기준으로 작성.)

- disk storage

- memory storage

### disk storage

`storage`에 정의할 수 있는 `DiskStorageOptions`는 아래와 같은 interface이다.

```js
interface DiskStorageOptions {
  destination?: string | (( // 1
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void
  ) => void) | undefined;
  filename?( // 2
      req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null, filename: string) => void
  ): void;
}

// ex
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if(fs.existsSync('업로드 위치')) {
      fs.mkdirSync('업로드 위치', { recursive: true });
    }

    cb(null, '업로드 될 위치')
  },
  filename: function (req, file, cb) {
    // 파일명 조작 (ex: 임의의 이름 생성 + 확장자)
    cb(null, '파일명')
  }
})
```

1. 파일이 저장될 위치를 지정한다. 만일 `destination`을 지정하지 않으면 **운영체제 시스템에서 임시 파일을 저장하는 기본 디렉토리를 사용한다.** 이전 `dest`를 사용했을 때와 다르게 **디렉토리가 없으면 `Error`를 발생시키기 때문에 주의해야한다.**

2. 저장 될 파일의 이름을 결정한다. 만일 `filename`이 주어지지 않는다면 **업로드 되는 파일은 확장자를 제외한 랜덤한 이름으로 지어진다.** 그렇기 때문에 **파일확장자를 직접 추가해야한다.**

<br>

### limit

속성들의 크기를 제한을 지정할 수 옵션이다. 사용할 수 있는 옵션은 아래와 같다.

| 속성           | 설명                                                           | 기본값    |
| :------------- | :------------------------------------------------------------- | :-------- |
| `fileNameSize` | 필드명 사이즈 최대값                                           | 100 bytes |
| `fieldSize`    | 필드값 사이즈 최대값                                           | 1MB       |
| `fields`       | 파일 형식이 아닌 필드의 최대 개수                              | 무제한    |
| `fileSize`     | multipart 형식 폼에서 최대 파일 사이즈 (bytes)                 | 무제한    |
| `files`        | multipart 형식 폼에서 파일 필드의 최대 개수                    | 무제한    |
| `parts`        | `multipart/form-data`에서 파일과 필드의 갯수                   | 무제한    |
| `headerPairs`  | multipart 형식 폼에서 파싱할 헤더의 <key,value> 쌍의 최대 개수 | 2000      |

<br>

### fileFilter

`fileFilter`는 어느 파일을 업로드 할지, 혹은 건너뛸지 제어할 수 있다. `fileFilter`는 아래와 같은 `syntax`를 가지고 있다.

```ts
 fileFilter?(req: any, file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
}, callback: (error: Error | null, acceptFile: boolean) => void): void;

//ex
fileFilter: (req, file, cb) {
  // 이 함수는 boolean 값과 함께 `cb`를 호출함으로써 해당 파일을 업로드 할지 여부를 나타낼 수 있습니다.
  // 이 파일을 거부하려면 다음과 같이 `false` 를 전달합니다:
  cb(null, false)
  // 이 파일을 허용하려면 다음과 같이 `true` 를 전달합니다:
  cb(null, true)
  // 무언가 문제가 생겼다면 언제나 에러를 전달할 수 있습니다:
  cb(new Error('I don\'t have a clue!'))
}
```

<br>

## NestJs에서 Multer 옵션 부여하기

### Module에 Import하기

`@nestjs/platform-express`에서 제공하는 `MulterOptionsFactory`, `MulterModuleAsyncOptions` 인터페이스를 구현함으로 `Multer` 옵션을 생성하는 프로바이더를 생성할 수 있다.

`MulterOptionsFactory`와 `MulterModuleAsyncOptions`의 인터페이스는 아래와 같다. 프로바이더를 작성할 때 `configModule`와 같은 것들을 이용하고자 하면 `MulterModuleAsyncOptions`를 이용하면 된다. (현재 글은 `MulterOptionsFactory`를 기준으로 작성한다.)

```ts
export interface MulterOptionsFactory {
  createMulterOptions(): Promise<MulterModuleOptions> | MulterModuleOptions;
}
export interface MulterModuleAsyncOptions
  extends Pick<ModuleMetadata, "imports"> {
  useExisting?: Type<MulterOptionsFactory>;
  useClass?: Type<MulterOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<MulterModuleOptions> | MulterModuleOptions;
  inject?: any[];
}
```

`MulterOptionsFactory`를 구현하였다면 `Module`에서 `import`를 받을 수 있다.

```ts
@Injectable()
export class MulterConfigService implements MulterOptionsFactory {
  createMulterOptions(): MulterOptions {
    return { ... }
}


imports: [{
  MulterModule.registerAsync({
    useClass: MulterConfigService
  })
}]
```

<br>

### Interceptor에 부여하기

[Upload하기](#upload하기)에서 Interceoptor의 파라미터로 `MulterOption`을 부여할 수 있다고 하였다. `MulterOptions`에 맞는 형식의 `Object`를 만들어 넣어주어도 되며 혹은 `MulterOptions`을 return 하는 함수를 실행시켜주어도 된다.

```ts
const options: MulterOptions = {...}
function getMulterOptions() : MulterOptions { return {...} }

@Post('/upload')
@UseInterceptors(FileInterceptor('file',options))
@UseInterceptors(FileInterceptor('file',getMulterOptions()))
uploadFile(@UploadedFile() file: Express.Multer.File) {...}
```

## REFERENCE

- https://docs.nestjs.com/techniques/file-upload

- https://github.com/expressjs/multer
