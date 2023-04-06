# Docker Installation

클라우드 서비스를 운영하는 것이 가용성과 확장성 측면에서 이점을 얻을 수 있다. 다만 무료가 아니며 편리함을 얻는 대신 상응하는 비용을 지불해야한다.

클라우드 서비스 만큼은 아니지만 이미 만들어진 도커 이미지를 이용하여 클라우드 서비스와 동일하지는 않지만 비슷한 효과를 누리기 위해 Docker를 서버에 설치하고자 한다.

또한 현재 토이 프로젝트가 가용성 및 확장성을 크게 고려하지 않아도 되기 때문에 Docker를 이용하고자 한다. (**서비스가 커져 클라우드 서비스를 필요로 한다면 그 때 사용하면 된다.**)

<br>

## Goal

- 우분투 20.04에서 Docker를 설치하고 `status`를 확인해보자
- docker compose를 이용하여 Postgresql을 설치하자

<br>

## 우분투 20.04에서 Docker를 설치하는 방법

Docker를 설치하는 방법은 정말 간단히 공식문서에 적혀있는 그대로 따라하면 설치가 완료되는 것을 볼 수 있다.

### 이전 버전 삭제

혹시 이미 이전 버전의 도커가 설치되어 있다면 아래와 같은 명령어로 기존 설치 Docker를 제거할 수 있다.

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

도커 이미지, 컨테이너, 볼륨, 네트워크는 `/var/lib/docker/`에 저장되어 있으며 Docker를 제거 할 때 자동으로 제거되지 않는다. 새로 설치하고 기존의 데이터를 정리하려면 [도커 엔진제거](https://docs.docker.com/engine/install/ubuntu/#uninstall-docker-engine)를 참조하면 된다.

<br>

### Docker 설치

도커를 설치하는 흐름은 아래와 같다.

1. Docker Repository를 활성화 하기 위한 패키지 설치
2. Repository GPG 키를 가져온다.
3. Repository 설정
4. Docker 엔진을 설치한다.

<br>

### 1. Docker Repository를 활성화 하기 위한 패키지 설치.

Docker 저장소를 활성화 시키기 위해 패키지 설치 가능한 리스트를 최신화 후 필요한 패키지를 설치한다.

```bash
# 패키지 인덱스 최신화
sudo apt-get update

# 패키지 설치
sudo apt-get install ca-certificates \
                     curl \
                     gnupg
```

<br>

### 2. Repository GPG 키를 가져온다.

GPG 키를 추가하기 위해 공식문서에 있는 명령어를 입력한다.

```
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
```

<br>

### 3. Repository 설정

Repository 설정을 위해 공식문서에 있는 명령어를 입력한다.

```bash
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

<br>

### 4. Docker 엔진을 설치한다.

설치 가능한 리스트를 최신화 후 도커 엔진을 설치한다. `docker compose`는 Docker 엔진을 설치할 때 **plugin을 추가하여 추 후 별도로 설치하는 것이 아니라 같이 설치할 것이다.**

```bash
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

<br>

### Docker를 실행

Docker를 설치하고 실행하려면 아래와 같은 명령어를 입력하면 Docker가 실행된다.

```bash
sudo service docker start
```

<br>

Docker가 실행되고 정상적으로 Docker가 실행되고 있는지 확인하려면 `service docker status`명령어를 입력하면 현재 Docker의 서비스 상태를 알 수 있다.

```bash
# command
sudo service docker status

# result
● docker.service - Docker Application Container Engine
     Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
     Active: active (running) since Wed 2023-04-05 23:51:04 KST; 51min ago
TriggeredBy: ● docker.socket
       Docs: https://docs.docker.com
   Main PID: 25710 (dockerd)
      Tasks: 28
     Memory: 383.0M

# command
docker --version

# result
Docker version 23.0.3, build 3e7cbfd

# command
docker compose version

# result
Docker Compose version v2.17.2
```

여기서 특이한 점은 `docker compose`를 별도로 설치했을 때는 `docker-compose`명령어를 이용하여 `docker compose`를 사용하였었는데 plugin으로 설치를 하니 `docker compose`를 이용하여 사용할 수 있는 것을 볼 수 있다.

<br>

## Docker compose를 이용하여 Postgresql 설치하기

명령어로 Postgresql을 Docker로 실행할 수 있지만 추 후 **인프라를 재 구축 하거나 할 때 동일한 환경 구축을 위하여** `Docker compose`로 작성하여 실행하고자 한다.

또한 컨테이너가 삭제되거나 다른 이슈로 인해 사용하지 못하게 되었을 경우를 대비하여 볼륨을 로컬에 잡아 다음 컨테이너가 실행되더라도 데이터를 보존할 수 있다. `Docker compose`는 아래와 같다.

```yml
version: "3"

services:
  # 서비스 명
  postgresql:
    # 사용할 이미지
    image: postgres:15.2
    # 컨테이너 실행 시 재시작
    restart: always
    # 컨테이너명 설정
    container_name: postgres
    # 접근 포트 설정 (컨테이너 외부:컨테이너 내부)
    ports:
      - "5432:5432"
    # 환경 변수 설정
    environment:
      # PostgreSQL 계정 및 패스워드 설정 옵션, 데이터베이스 설정
      POSTGRES_USER: root
      POSTGRES_PASSWORD: "password"
      POSTGRES_DB: test
    # 볼륨 설정
    volumes:
      - ~/data/postgres/:/var/lib/postgresql/data
```

<Br>

`docker-compose.yml`이라는 파일을 생성 후 설정들을 적어주었으며 `docker compose`로 Postgresql을 설치할 때 추가할 수 있는 옵션들의 상세는 [DockerHub - Postgresql](https://hub.docker.com/_/postgres)에서 확인할 수 있다.

이제 작성한 `docker-compose.yml`를 아래 명령어를 이용하여 실행 후 결과를 확인할 수 있다.

```bash
# command
docker compose up -d

# command (실행 중인 컨테이너 확인)
docker ps

# result
CONTAINER ID   IMAGE           COMMAND                  CREATED        STATUS        PORTS                                       NAMES
66c26a700494   postgres:15.2   "docker-entrypoint.s…"   23 hours ago   Up 22 hours   0.0.0.0:5432->5432/tcp, :::5432->5432/tcp   postgres
```

<br>

## References

- https://docs.docker.com/engine/install/ubuntu/

- https://hub.docker.com/_/postgres
