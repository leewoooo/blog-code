# Nginx Installation

추 후 API서버와 관리자 페이지에 대한 분기가 필요하기 웹 서버 하나가 더 필요하여 Nginx를 설치하고 설치하는 방법을 기록하고자 한다.

<br>

## Goal

- 우분투 20.04에서 Nginx를 설치하고 index 화면을 띄워보자

<br>

## 우분투 20.04에서 Nginx를 설치하는 방법

Nginx를 설치하는 방법은 간단하다 아래와 같은 명렁어를 입력해주면 끝이다.

```bash
sudo apt update # 설치 가능한 리스트 최신화
sudo apt install nginx # Nginx 설치
```

위와 같은 명령어를 치고 `-v` 명령어와 함께 입력하면 잘 설치 된 것을 볼 수 있다.

```bash
nginx -v
nginx version: nginx/1.18.0 (Ubuntu) # 작성일 기준 1.18.0 설치
```

<br>

## Nginx를 실행

Nginx를 설치하고 실행하려면 아래와 같은 명령어를 입력하면 nginx가 실행된다.

```bash
sudo service nginx start
```

Nginx가 실행되고 정상적으로 Nginx가 실행되고 있는지 확인하려면 `service nginx status`명령어를 입력하면 현재 Nginx의 서비스 상태를 알 수 있다.

```bash
# command
sudo service nginx status

# result
 nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2023-04-04 21:00:24 KST; 11s ago
       Docs: man:nginx(8)
    Process: 10335 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
    Process: 10341 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
   Main PID: 10346 (nginx)
      Tasks: 7 (limit: 2333)
     Memory: 6.7M
     CGroup: /system.slice/nginx.service
             ├─10346 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
             ├─10347 nginx: worker process
             ├─10348 nginx: worker process
             ├─10349 nginx: worker process
             ├─10350 nginx: worker process
             ├─10351 nginx: worker process
             └─10352 nginx: worker process

```

위에 status를 토대로 확인하면 Master Process가 하나 생성된 것을 볼 수 있으며 Master Process과 관리하는 Worker Process가 생성된 것을 확인할 수 있다. Nginx가 설치 되었을 때 default로 정의 된 설정 파일을 확인해보면 `worker_processes auto;`와 같이 되어있다.

통상적으로 `worker_processes auto;`를 그대로 사용하거난 Worker Process를 Cpu 코어 수와 동일하게 설정을 한다. (코어 수 보다 더 높게도 할당이 가능하다.)

<br>

## Index 화면 확인하기

기본적으로 Nginx를 설치하면 `80`포트를 이용하여 index 페이지에 접근이 가능해진다. `Http` 프로토콜을 이용하여 도메인을 입력하면 기본적으로 `80`포트에 접속이 된다.

<img width="1438" alt="image" src="https://user-images.githubusercontent.com/74294325/229787500-36c252aa-3fcc-4039-ae53-bb8b7a743ea4.png">

<br>

어떻게 index 화면이 보여질 수 있는 건가에 대해서는 Nginx가 설치 되었을 때 default로 정의 된 설정 파일을 확인하면 알 수 있다.

```bash
# nginx.conf
http {
   # ...
	include /etc/nginx/conf.d/*.conf;
	include /etc/nginx/sites-enabled/*;
}

# /etc/nginx/sites-enabled/default
server {
   # ...
	listen 80 default_server;
	listen [::]:80 default_server;
	root /var/www/html;
	index index.html index.htm index.nginx-debian.html;
   # ...
}

# Command
ls /var/www/html/

# Result
index.nginx-debian.html
```

nginx.conf파일에 `include /etc/nginx/sites-enabled/*;`로 인해 `/etc/nginx/sites-enabled`에 있는 파일들이 nginx.conf이 포함되게 되었다.

`/etc/nginx/sites-enabled`에는 `default` 설정 파일이 들어 있으며 서버 블록을 확인해보면 `80`포트로 들어올 때 index를 바라보게 되어있으며 index 화면에 이용될 문서들은 `index.html index.htm index.nginx-debian.html;`로 정의되어 있다.

그럼 마지막으로 `/var/www/html`경로에 어떠한 파일이 들어있는지 확인해보면 `index.nginx-debian.html`가 설치되어 있는 것을 볼 수 있다.

<br>

## Cafe24 가상서버호스팅에서 Nginx를 설치하던 도중 발생한 문제

가상호스팅 서버에서 발생한 문제 및 해결

### apt update, apt install nginx 명령어 실패

Nginx를 설치하기 위해 `apt update`를 이용하여 설치 리스트 최신화를 진행 후 Nginx를 설치하려 하였는데 아래와 같은 Error가 동일하게 발생하였다.

![Nginx-설치-실패](https://user-images.githubusercontent.com/74294325/229791128-7ffd0fdc-4bc4-4eee-9438-d84812a6e321.png)

<br>

#### 해결

방화벽 outbound 설정에서 외부로 나가는 포트가 전부 열려있지 않아서 내부 -> 외부 접속이 막혀있었던 것이 문제였음.

**방화벽 outbound에서 외부 접속에 필요한 port를 open해서 해결**

<br>

## References

- https://www.nginx.com/

- https://www.popit.kr/%EC%8A%A4%ED%83%80%ED%8A%B8%EC%97%85-%EA%B0%9C%EB%B0%9C%EC%9E%90-%ED%98%BC%EC%9E%90-%EB%B9%A0%EB%A5%B4%EA%B2%8C-%EC%8B%B8%EA%B2%8C-%EC%84%9C%EB%B2%84-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-1%ED%8E%B8/
