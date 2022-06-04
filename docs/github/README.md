# Node Project에 Github Action을 이용해 CI 적용하기

## Goal

- Github Action의 사용법 Study

- Github Action을 이용하여 `NestJs` 프로젝트 CI 적용시키기

<br>

## Why?

[최근 토이프로젝트](https://github.com/i-am-a-toy/passion)에 테스트 코드를 적용시키며 진행하다 보니 저절로 `CI`에 관심이 생기게 되어 현재 사용중인 Github에서 `CI`를 적용해보기로 하였다. (추 후 배포를 하게 되는 수준이 온다면 `CD`까지 적용을 해볼 예정이다.)

<br>

## CI란?

간단하게 이야기 하면 **테스트/빌드 자동화** 프로세스이다. `CI`는 Continuous Integration의 약자로 번역하자면 **지속적인 통합**을 이야기한다.

`CI`를 구축하게 되면 새로운 코드에 대한 변경사항에 대한 **테스트 및 빌드 결과가 공유되며 여러 개발자가 작성한 코드에 대한 충돌 혹은 변경사항으로 생기는 문제를 방지할 수 있도록 해준다.**

<br>

## Github Action을 이용하여 `CI` 진행하기

Github Action을 이용하여 `CI`과정을 진행하려면 아래와 같은 순서를 거친다.

1. Project Root에 `.github/workflows` 디렉토리 생성

2. `yml` 파일을 작성하여 Process 정의하기

<br>

### yml 작성하기

작성한 yml 파일을 살펴보며 정리하기를 원한다.

```yml
name: development CI // 1

on: // 2
  push:
    branches-ignore:
      - "release"
  pull_request:
    branches-ignore:
      - "release"

defaults: // 3
  run:
    working-directory: ./hello-typeorm

jobs:
  node_CI:
    runs-on: ubuntu-latest // 4

    strategy: // 5
      matrix:
        node-version: [16.x]

    steps:
      - name: Checkout source code
        uses: actions/checkout@v3 // 6

      - name: Set up Node.js
        uses: actions/setup-node@v3 // 7
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install dependencies
        run: yarn install // 8

      - name: Test unit
        run: yarn test // 9

      - name: build
        run: yarn build // 10
```

<Br>

1. workflow의 이름을 정의한다. 해당 이름은 아래와 같이 확인할 수 있다.

    <img src = https://user-images.githubusercontent.com/74294325/171982331-53554223-43db-4809-9a18-88bfc5a4f8b9.png>

<br>

2. 어떠한 이벤트가 발생할 때 마다 해당 Workflow가 실행 될지 결정한다. 현재는 `release` 브랜치를 제외한 모든 브랜치에서 `PR` 혹은 `push`가 되면 실행된다. 더 자세한 것은 [Triggering a workflow](https://docs.github.com/en/actions/using-workflows/triggering-a-workflow)를 참조하면 된다.

<br>

3. 해당 workflow가 기본적으로 어느 위치에서 실행될지 정한다. 현재 나의 저장소 구조는 아래 사진과 같기 때문에 해당 옵션을 사용하였다. (mono repo 구조에서 각 앱에 대한 workflow를 적용할 때도 사용)

    <img src = https://user-images.githubusercontent.com/74294325/171982597-b70fd918-ea2f-4b47-b2b8-c770590fa36b.png>

<Br>

4. workflow가 동작할 `os`를 지정한다. Github Action에서는 linux말고 windows, mac os 등등 지원을 한다. [제공 OS](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idruns-on)

<Br>

5. 메트릭스 전략을 이용하여 workflow를 구성할 수 있다. 현재 `node-version`을 배열 형태로 정의하였는데 만약 배열 안에 `node-version`이 여러개 지정되어 있다면 **가져다가 사용하는 곳에서는 버전의 갯수만큼 작업을 실행한다.** [strategy](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategy)

<br>

6. `uses` 명령어는 이미 정의된 Action을 가져다가 사용하는 것이며 `actions/checkout@v3`는 현재 저장소에 있는 소스코드를 workflow가 동작하는 os로 **Checkout**하는 작업이다. [checkout](https://github.com/actions/checkout)

<Br>

7. `uses` 명령어는 이미 정의된 Action을 가져다가 사용하는 것이며 `actions/setup-node@v3`는 node의 배포판을 가져다가 사용하는 것이다. 또한 `npm` or `yarn`을 선택할 수 있다. 버전은 위에서 정의한 `matrix`에서 가져오게 된다. [node](https://github.com/actions/setup-node)

<br>

8. 프로젝트에서 사용한 의존성을 추가한다.

<br>

9. package.json에 정의된 `script`중 `test`를 이용하여 **테스트 코드를 실행한다.**

<br>

10. package.json에 정의된 `script`중 `build`를 이용하여 **프로젝트를 빌드한다.**

<br>

## 결과 보기

위와 같이 작성을 한 후 저장소에 `push`를 하게되면 `Action`이 실행되는 것을 볼 수 있다.

<img src = https://user-images.githubusercontent.com/74294325/171983233-2e554c21-312e-4c2c-b9f0-90b0ca87b593.png>

<br>

`node_CI` 옆에 붙은 (16.x)는 `yml`을 작성할 때 정의한 `node-version`이 붙은 것이며 사진과 같이 해당 프로젝트의 `test`가 정상적으로 잘 실행된 것을 볼 수 있다.

`CI`를 변경된 소스코드에 대하여 `test`나 `build`가 실패하는 경우 `PR`을 받지 말고 수정을 요청을 할 수 있으며 통과하면 병합을 시키는 전략을 선택함으로 **지속적인 통합을 이뤄갈 수 있다.**

<br>

## act

이 글을 작성하면서 나는 저장소에 실제로 push하면서 진행을 하였다. ~~나의 처참한 결과물...~~

<img src = https://user-images.githubusercontent.com/74294325/171983697-56d06db8-f8dc-4a2e-bb71-779cadd01e78.png>

<br>

하지만 local에서 Github Action을 돌릴 수 있는 방법이 있었다. 바로 [act](https://github.com/nektos/act)였다.

방법은 간단하다. m1 기준으로 `brew`를 이용하여 설치하고 프로젝트 위치에서 실행시켜주면 된다. (docker를 이용하여 돌리기 때문에 docker가 실행되어 있어야 함.)

```zsh
// m1 경로 차이로 인해 앞에 arch -arm64를 붙여주었음.
arch -arm64 brew install act    
```

<br>

설치 후 실행한 결과는 아래의 사진과 같다.

<img src = https://user-images.githubusercontent.com/74294325/171983817-4648b286-22ce-46b4-a0e0-319ea525e700.png>

<Br>

## Reference 

- https://docs.github.com/en/actions

- https://www.redhat.com/ko/topics/devops/what-is-ci-cd

- https://github.com/nektos/act

