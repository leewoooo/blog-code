# Flutter App을 Iphone에서 실행시켜보자

해당 글은 보며 진행하실 분들은 미리 Apple Developer 계정을 등록하고 진행해주시면 감사하겠습니다. - [Apple Developer](https://developer.apple.com)

<br>

## Problem

Flutter로 개발한 App을 ios simulator에서만 실행하기에는 실제 핸드폰에서 어떻게 동작하는지 디버깅하기 어려움

<br>

## Goal

- Flutter App을 iphone에 빌드해서 테스트 하여 해결하기
- Error가 발생 한다면 해당 내용 기록하기

<br>

## 핸드폰과 mac을 연결하기

테스트를 하고자 하는 핸드폰과 mac을 연결하면 아래와 같이 핸드폰에 현재 mac을 신뢰하겠냐는 Alert이 나오게 된다.

![케이블_연결](https://user-images.githubusercontent.com/74294325/227754707-25cdb24f-91d8-4113-98d5-9594b140d531.png)

<br>

"신뢰"를 선택하면 Finder에서 연결 된 핸드폰이 리스트에 생성된 것을 확인할 수 있으며 핸드폰의 정보들을 mac에서 확인이 가능해진다.

![Finder_기기명](https://user-images.githubusercontent.com/74294325/227754804-573e995d-cd7e-4367-8b24-162687b8bb38.png)

<br>

## 프로젝트에 ios 계정 등록하기

Flutter 프로젝트에서 아래와 같은 명령어를 입력하면 해당 프로젝트를 Xcode에서 열 수 있다.

```bash
open ios/Runner.xcworkspace
```

<br>

명령어를 입력하면 Xcode에서 프로젝트가 열리게 되며 [핸드폰과 mac을 연결하기](#핸드폰과-mac을-연결하기)에서 등록한 핸드폰을 선택할 수 있게 된다.

![Xcode_기기연결](https://user-images.githubusercontent.com/74294325/227755045-e4acbe53-34c1-4adf-9788-c78b462e36a6.png)

연결한 핸드폰을 선택하고 실행하려고 하면 아래와 같은 Error문구를 확인할 수 있다.

![계발자_등록](https://user-images.githubusercontent.com/74294325/227755068-05f2dc19-d7ab-4ca4-8258-2e198026f61d.png)

Error문구에 나와있는대로 "Runner"에는 개발 팀(개인)의 서명이 반드시 필요하다는 문구이다. 해당 Error는 AppleID를 "Runner"에 등록함으로 쉽게 해결할 수 있다.

AppleID를 "Runner"에 등록하는 방법은 2가지가 있다.

1. Xcode의 "Settings"의 "Accounts"탭에서 등록하는 방법.
2. "Singing & Capabilities" 에서 등록하기

AppleID를 등록한 후 "Singing & Capabilities"에서 등록한 계정을 선택해주면 해당 Error가 없어진걸 확인할 수 있다.

![개발자_등록_과정](https://user-images.githubusercontent.com/74294325/227755290-bccfab3a-7cb1-4db9-aea6-201522867664.png)

<br>

## 핸드폰에서 개발자 모드 활성화 하기

Flutter로 빌드 된 App을 실행하려면 핸드폰에서 개발자 모드가 활성화 되어있어야 한다. 개발자 모드가 활성화 되어 있지 않으면 아래와 같은 Error를 만날 수 있다.

![Xcode_핸드폰선택](https://user-images.githubusercontent.com/74294325/227783292-5af0b7e3-8b19-4f72-a825-897a92656c57.png)

<br>

일반적으로 `설정 > 개인정보 보호 및 보안 > 개발자 모드`에서 활성화 할 수 있다.

![개발자모드_탭](https://user-images.githubusercontent.com/74294325/227764849-9f17ceb6-cd01-4cc6-9af6-ef94f35d109d.png)

<br>

**하지만** 개발자 모드가 보이지 않는 경우도 있을 것이다. 해당 관련 글들을 찾아보니 **Apple Developer에 등록된 기기에만 활성화가 된다는 글들이 있었다.**

필자는 [프로젝트에 ios 계정 등록하기](#프로젝트에-ios-계정-등록하기)를 설정 후 확인해 보니 해당 메뉴가 활성화 되어 있었다.(테스트 할 핸드폰이 Apple 개발자 계정에 등록되어 있다.)

개발자 모드를 활성화 하면 재부팅이 되며 활성화 시킬 것인지에 대한 컨펌창이 뜨게 된다. 해당 컨펌창에서 활성화 후 핸드폰 암호를 입력하면 정상적으로 개발자 모드가 활성화 된다.

개발자 모드가 정상적으로 활성화 되면 "Developer Mode disabled"가 사라진 것을 볼 수 있다.

<br>

## 테스트 핸드폰에 현재 Apple 개발자 신뢰

개발자 모드까지 활성화 하고 빌드하면 정상적으로 실행될 것으로 예상했지만 그렇지 못했다. 테스트 할 핸드폰에 **빌드까지는 가능할지 모르겠지만 Flutter로 개발한 App은 실행되지 않는다.**

[프로젝트에 ios 계정 등록하기](#프로젝트에-ios-계정-등록하기)에서 등록한 개발자 계정을 신뢰하지 못한다는 alert를 만나게 된다.

1. Xcode Error

   ![XCode_개발자신뢰](https://user-images.githubusercontent.com/74294325/227784151-93b164c2-26ed-4db8-ab92-0ec2948803b5.png)

2. 테스트 핸드폰 Alert

   ![개발자신뢰_핸드폰](https://user-images.githubusercontent.com/74294325/227783928-1a1765bd-4b8e-4147-83ee-6e4a1e2a45af.jpeg)

해결방법은 간단하다 [프로젝트에 ios 계정 등록하기](#프로젝트에-ios-계정-등록하기)에서 등록한 개발자 계정을 테스트 할 핸드폰에서 신뢰 설정을 해주면 된다.

`일반 > VPN 및 기기 관리`에 들어가면 "개발자 앱" 밑에 위에서 등록한 개발자 계정이 보일 것이다.

![개발자신뢰_1](https://user-images.githubusercontent.com/74294325/227784106-f665eaa2-e565-44ad-98ec-538e3fc3d51a.jpeg)

개발자 개정을 탭하여 신뢰 설정을 할 수 있다.

![개발자신뢰_2](https://user-images.githubusercontent.com/74294325/227784375-bdf8df01-ca9a-4b46-a02f-3ee14b1e6e98.jpeg)

<br>

## iProxy 설정

개발자 등록, 개발자 신뢰까지 진행하였으니 정상적으로 되겠지? 생각하였지만 또 하나의 Error가 발생하게 된다.

![max_iproxy](https://user-images.githubusercontent.com/74294325/227784553-d4278b6b-e90d-41e1-8cd5-8ca52545140c.png)

iProxy Error가 발생하는 이유는 Flutter 개발 도구 중 iOS 앱을 실행할 때 사용하는 도구가 컴퓨터 보안 설정 때문에 차단되었을 때 발생하게 된다.

문제가 발생하면 위의 사진과 같이 iproxy 개발자를 확인할 수 없다는 메시지 (macOS cannot verify the developer of “iproxy”)가 표시된다.

해결방법은 **mac**의 `시스템 환경설정 (System Preferences) > 보안 및 개인 정보 보호 (Security & Privacy)`로 들어가보면 화면 내 다음에서 다운로드한 앱 허용 (Allow apps downloaded from)을 보면 iproxy가 차단되었다는 메시지를 확인할 수 있을 것이다.

여기에서 허용(Allow anyway) 버튼을 눌러 iproxy를 허용해 주면 해당 Error를 해결할 수 있다.

![max_iproxy_해결](https://user-images.githubusercontent.com/74294325/227784837-3dfd3a42-999e-46c3-972b-4adfd0b36360.png)

<br>

## 빌드 후 확인

Xcode에서 테스트 핸드폰을 설정 후 실행을 해보자. 실행은 아래의 사진과 같이 플레이 버튼 처럼 생긴 버튼을 선택하면 현재 선택 된 핸드폰에 빌드를 시작한다.

![XCode빌드](https://user-images.githubusercontent.com/74294325/227785122-4c159a1f-918a-44f7-b31f-5c3e21bc7cdd.png)

빌드가 완료되면 테스트 핸드폰에 Flutter App이 설치가 되고 실행되게 된다. 성공해서 너무 기쁘다 :)

![아이폰빌드](https://user-images.githubusercontent.com/74294325/227785311-90192a16-9762-49b9-80ed-9a3935041ac0.jpeg)

<br>

## 추가적으로

Flutter App을 핸드폰에서 테스트 하려면 **가장 중요한 건 mac OS의 최신 소프트웨어와 Xcode의 최신버전이라 생각이 든다...!**

최신이 아닐 경우 Xcode에서 지원 하는 ios버전에 한계가 있어 정상 적인 테스트가 어려워 질 수 도 있다. 실제로 이번 글을 쓰면서 해당 Error를 만났다.

![XCode빌드_버전지원](https://user-images.githubusercontent.com/74294325/227785578-a7fe909b-a797-4e97-84ab-ecf25f4def51.png)

<br>

위 Error를 해결하기 위해서는 [iOS-DeviceSupport](https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport)에서 DeviceSupport를 다운받아 추가하는 방식도 있지만 최신 버전에 대해서는 지원이 바로바로 되지 않기 때문에 Xcode의 최신 버전으로 진행하는게 좋다.

![XCode_버전_충돌](https://user-images.githubusercontent.com/74294325/227785805-b7a496b5-738c-44e9-a746-459a89317233.png)

위 사진이 mac OS 버전과 Xcode의 버전 충돌이 발생한 Error이다. 이 Error 또한 이번 글을 쓰면서 만난 Error이다.

이 2개의 Error는 mac OS와 최신 Xcode를 사용하면 쉽게 해결할 수 있는 Error이다. **그렇기 때문에 최신 Xcode와 Xcode에서 요구하는 버전을 맞춰서 진행하는 것이 좋을 것 같다.**

<br>

## Reference

- https://es1015.tistory.com/480

- https://www.androidhuman.com/2021-07-14-flutter_ios_iproxy

- https://code-boki.tistory.com/110

- https://github.com/iGhibli/iOS-DeviceSupport/tree/master/DeviceSupport
