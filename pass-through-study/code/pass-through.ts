import { PassThrough, Readable } from 'stream';

//TODO: s3에서 받아오는 것처럼 코드 작성한 후 스트림 생성하기, 2. 스트림 여러개를 생성하여 이벤트를 통해 각각의 스트림에게 데이터를 뿌려주기 3. 결과 확인하기
const readableStream = new Readable();
const stream1 = new PassThrough();
stream1.on('data', (chunk) => {
  console.log(Date.now());
  console.log(chunk);
});

stream1.on('end', () => {
  console.log('stream1 end');
});

const stream2 = new PassThrough();
stream2.on('data', (chunk) => {
  console.log(Date.now());
  console.log(chunk);
});
stream2.on('end', () => {
  console.log('stream2 end');
});

readableStream.on('data', (data) => {
  stream1.write(data);
  stream2.write(data);
});

readableStream.push(
  'asdfsdfasdfadasffdsafasdfgsadgjkhfsdahjkgfjhksadgfhjkgasdhjkfghjksadghgfjksadgfhgsadkjhfgshadjgfhjkasgdkhjfghasdj',
);
readableStream.push(null);
