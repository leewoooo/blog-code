# NestJS Project Docker Image만들기

## Goal

- NestJs Project를 Docker Image로 만들기.

<br>

## Image Variants

Docker 공식 홈페이지에서는 아래와 같은 3가지의 변형 이미지를 소개하고 있다.

- `node:<version>`

- `node:<version>-slim`

- `node:<version>-alpine`

<br>

### `node:<version>`

`NodeJs`의 실제 이미지이다. `NodeJs`의 이미지 중 어떠한 것을 선택해야 할 지 불확실하다면 해당 이미지를 사용하라고 이야기 하고 있다.

주로 해당 변형 이미지는 **배포 혹은 base Image로 사용된다.**

간혹 뒤에 `buster`나 `stretch`가 붙는 경우가 존재하는데 이러한 경우는 `Debian`계열 이미지를 베이스로 배포되었다는 것을 나타낸다. (즉 현재 이미지가 어떠한 릴리즈를 기반으로 배포되었는지를 알 수 있는 척도가 된다.)

<br>

### `node:<version>-slim`

`slim`이 붙은 이미지는 **실행하기 위한 최소한의 패키지만을 포함하고 있다.** 기본이미지(`node:<version>`)에 포함된 **공통 패키지는 포함하고 있지 않습니다.**

배포 환경에 용량제한이 심한 경우가 아니라면 기본이미지(`node:<version>`) 사용을 추천한다고 한다.

<br>

### `node:<version>-alpine`

`node:<version>-alpine`는 유명한 `Alpine Linux` 프로젝트를 기반으로 한다. `alpine` 리눅스는 대부분의 배포 기반 이미지 보다 작으며(~5MB), 따라서 일반적으로 작은 이미즈를 만들 수 있다.

참고로 `glibc`와 `friends`를 사용하는 대신 `musl libc`를 사용한다는 점으로 **libc를 필요로 하는 소프트웨어에서 이슈가 발생할 수 있다.**

<br>

## dockerfile, dockerignore

프로젝트를 `docker` 이미지로 만들기 위해서는 `dockerfile` 및 `dockerignore`를 작성해야 한다. (vs-code를 사용하고 있다면 `Docker` Extension을 설치하면 도움을 받을 수 있다. [Docker Extension](https://github.com/microsoft/vscode-docker))

현재 글에서 `dockerfile`, `dockerignore`에 대해서는 깊게 설명하지 않을 것이다. 이전에 작성한 글을 참고하기를 바란다. [TIL-DockerFile](https://github.com/leewoooo/TIL/tree/main/Docker)

<br>

## 이미지 만들기

`NestJs`프로젝트는 기본적으로 빌드를 하게 되면 `dist`라는 디렉토리로 build 된 결과물이 포함되게 된다.

하지만 로컬에서 개발을 하다보면 프로젝트 루트에 dist가 존재하게 될 텐데 이미지를 빌드할 때 **개발할 때 build된 결과물이 포함되면 안될 것이다.**

이럴 때 작성하는 것이 `dockerignore`이다.

### dockerignore 작성

`dockerignore`에 기존 개발에 존재하던 `dist`, `node_module`를 제외하기 위해 아래와 같이 작성해준다.

`.gitignore`와 작성하는 방법은 동일하다.

```dockerignore
node_module
dist
```

<br>

이렇게 되면 이미지를 빌드할 때 `COPY`명령어를 사용하게 되는데 이 때 `dockerignore`에 포함 되어 있는 것들은 복사하지 않는다.

<br>

### dockerfile 작성

`dockerfile`을 작성할 때 2단계로 나눠서 작성을 하였다. Step을 2개로 나눈 이유는 빌드할 때는 기본이미지를 이용하여 빌드를 하고,

빌드 결과물을 Step 2로 가져와서 Step 2에서는 가벼운 이미지를 이용하여 `docker` 이미지를 생성하기 위해서이다.

작성한 `dockerfile`은 아래와 같다.

```dockerfile
# STEP 1
# 1
FROM node:16 AS builder
# 2
WORKDIR /app
# 3
COPY . .
# 4
RUN yarn
# 5
RUN yarn build

# STEP 2
#6
FROM node:16-alpine
#7
WORKDIR /app
#8
ENV NODE_ENV production
#9
COPY --from=builder /app ./
#10
CMD ["yarn","start:prod"]
```

<br>

### Step 1 (빌드 하는 단계)

1. `NestJs` 프로젝트를 빌드할 때 사용할 `docker`이미지를 정의한다. 현재 기본 이미지를 이용하였다.

2. 명령이 실행될 디렉토리를 `/app`으로 지정.

3. 현재 `dockerfile`이 위치한 곳에 있는 모든 소스들을 `/app`으로 복사한다. **이 때 `dockerignore`에 정의한 것은 복사되지 않는다.**

4. 현재 프로젝트가 의존하고 있는 의존성들을 가져온다.

5. `package.json`에 정의 된 `build` 스크립트를 실행한다.

<br>

### Step 2 (이미지 경량화 및 Server 실행)

6. 기본이미지 보다 작은 `alpine`이미지를 이용하여 이미지의 용량을 줄인다.

7. 명령이 실행될 디렉토리를 `/app`으로 지정.

8. `NODE_ENV` 환경변수를 `production`으로 정의한다.

9. Step 1에서 빌드 된 결과물을 복사해온다.

10. 서버 실행

<br>

## 이미지 빌드하기 및 실행하기

`dockerfile` 작성이 완료되었으면 해당 파일을 통해 이미지를 만들 수 있다.

<br>

### docker image build

```zsh
docker build -t <도커 이미지 이름> <docker file 경로>

//ex (프로젝트 루트)
docker build -t  hello-nestjs .
```

<br>

### docker container start

```zsh
docker run <도커 이미지 이름> ...(추가적인 option)
```

<br>

## Reference

- https://hub.docker.com/_/node

- https://github.com/leewoooo/TIL/tree/main/Docker
