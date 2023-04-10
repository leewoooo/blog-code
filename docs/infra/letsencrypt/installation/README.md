# Let's Encrypt를 이용하여 https를 적용해보자

Let's Encrypt를 이용하여 기존 http 프로토콜에서 https 보안 프로토콜을 적용해보자

**! 해당 글은 Nginx가 설치가 선행되어있다고 가정하고 작성된 글입니다.**

서버 스팩:

- OS: Ubuntu 20.04

<br>

## Why?

http를 이용을 하면 클라이언트와 서버의 완벽한 데이터의 무결성을 지키기가 어려워진다. https를 이용하여 보안 계층을 이용하여 **모든 유형의 데이터가 변경되거나 손상되지 않고 전달되기 위함니다.**

<br>

## Let's Encrypt를 사용하는 이유

Let's Encrypt는 사용자에게 무료로 TLS 인증서를 발급해주는 비영리기관이다. 게다가 웹서버로 Nginx를 이용하고 있는 중이며 "certbot"을 이용하면 명령어 몇 줄로 간단히 인증서를 발급받고 적용할 수 있기 때문이다. (~~분명 간단하다고 하였지만 역시 항상 오류는 언제 발생할 지 모른다.~~)

<br>

## Nginx 설정파일 구성하기

certbot은 SSL Nginx를 자동으로 구성할 수 있다. **자동으로 구성하기 위해서는 certbot이 서버 블록에서 확실한 정보를 찾을 수 있어야 한다.** 특히 SSL의 경우 `server_name`에서 감지하여 요청하는 방식으로 이루어 진다. 즉 인증서를 요청하는 **도메인 이름이 server_name에 정확하게 명시되어 이어야한다.**

예를 들어 `example.com` 도메인이라면 해당 도메인의 설정 파일을 `/etc/nginx/conf.d`디렉토리에 생성한다. 통상적으로 `도메인.conf`라고 명명한다.

설정파일을 생성 후 블록을 아래와 같이 정의한다. (예제에서는 https를 적용시키려 하는 도메인으로 들어올 때 `index.html`을 보여준다.)

```conf
server {
    listen 80;
	listen [::]:80;

    server_name example.com;

    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
}
```

<br>

정의 한 설정파일을 Nginx가 실행 될 때 load 되는 설정파일에 포함하면 된다. (`include`를 시켜도 되고 해당 설정 파일에 직접 정의해도 된다.

설정을 마무리 하였으면 Nginx를 재시작 해준다.

```bash
sudo service nginx restart
```

<br>

## 적용 하기 전 Nginx index화면

적용할 도메인의 블록을 정의 후 해당 도메인으로 접속하면 Nginx의 index화면에 접속을 해보면 브라우저에서 보완 연결이 사용되지 않았다는 문구가 보여진다. Let's Encrypt를 발급받아 적용하여 https를 적용해보자.

<img width="1438" alt="ssh전" src="https://user-images.githubusercontent.com/74294325/230907000-add5d97b-4922-472b-94cc-9e6ba146edea.png">

<br>

## certbot 설치 하기

먼저 Let’s Encrypt 클라이언트인 certbot을 설치한다. `Ubuntu 20.04`를 사용하고 있기 때문에 아래와 같은 명령어를 입력한다.

```bash
apt-get update
sudo apt-get install certbot
apt-get install python3-certbot-nginx # Ubuntu 18.04 이상부터는 python3
```

<br>

## 인증서 발급받기

certbot이 정상적으로 설치가 되었으면 https를 적용하려는 도메인에 아래와 같은 명령어로 적용시키면 된다.

```bash
sudo certbot --nginx -d example.com
```

1. --nginx: 인증 및 설치에 Nginx 플러그 인을 사용하기 위해 사용.
2. -d: 인증서를 발급받을 도메인을 도메인을 명시하기 위해 사용.

<br>

위의 명령어가 동작하다가 중간에 Nginx의 설정을 변경할 것인지 묻는다.

<img width="1438" alt="리다이렉트_설정" src="https://user-images.githubusercontent.com/74294325/230912336-1d4a920b-2cd0-4a88-a93d-0e9d182d3a16.png">

내용은 다음과 같다. 해당 도메인으로 들어오는 모든 http 요청에 대해서 https로 리다이렉트 시키는 설정으로 변경할 것을 물어본다. 필자는 여기서 2번 옵션을 선택하였다.

예전에는 http요청이 들어오면 https로 redirect 시켜주는 설정을 개발자가 직접 Nginx 설정을 통해 아래와 같이 명시하였다.

```bash
server {
   listen      80;
   server_name example.com;
   return 301 https://$host$request_uri;
}
server {
   listen       443;
   server_name  example.com;
   # ...
}
```

<br>

하지만 certbot을 이용하면 인증서를 적용하려는 도메인 설정 블록을 읽어 Redirect 설정을 자동으로 해주게 된다. (아래 설정 파일은 정상적으로 인증서가 발급 된 후 변경 된 Nginx 설정파일이다.)

```bash
server {
	server_name example.com;

	root /var/www/html;
	index index.html index.htm index.nginx-debian.html;


    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    # ...
}

server {
    if ($host = example.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

	listen 80;
	listen [::]:80;

	server_name example.com;
    return 404; # managed by Certbot
}
```

<br>

Redirect 자동 설정 옵션까지 선택을 하게되면 인증서 발급이 완료 된다. 완료가 되면 명령어창에 아래와 같이 축하한다는 글이 나오게 된다.(~~간단할 줄 알았지만 생각보다 긴 시간이였다...~~)

<img width="1438" alt="발급완료" src="https://user-images.githubusercontent.com/74294325/230914701-1ee21360-370a-4dc0-a8d8-12f0a8efa15c.png">

사진을 보면 정상적으로 완료 되어있는 것을 볼 수 있으며 **만료일 까지 명시되어 있다.** Nginx의 설정을 certbot을 통해 변경하였으니 해당 설정을 다시 적용시켜 주자.

```bash
sudo service nginx restart
```

<br>

### 중간에 만난 Error

<img width="1438" alt="인증서_발급_오류_방화벽" src="https://user-images.githubusercontent.com/74294325/230909774-ae77337f-80d2-4a45-9ba8-425ab2d40e79.png">

위 명령어를 입력하니 **Connect Timeout이 발생하였다** Error 메세지에 **너무나도 친절하게 "likely firewall problem"이라고 적혀있었다.**

카페24 가상호스팅을 사용하고 있는 필자는 인바운드 설정에서 `80/tcp`, `443/tcp`를 열어놓지 않았기 때문에 발생하는 문제였다. (특정 IP만 인바운드에 80, 443을 열어놨지만 외부에서 인증서 발급을 위해 들어오는 IP를 특정할 수 없기 때문에 80, 443 포트를 열어야 했다.)

<br>

## 결과 확인

인증서를 적용시킬 도메인으로 다시 접속을 하게 되면 https가 정상적으로 적용된 것을 볼 수 있다. 만약 Client가 해당 도메인으로 접속을 할 때 http 프로토콜을 이용하여 접속을 하더라도 Redirect 설정으로 인해 https로 Redirect되는 것을 확인할 수 있다.

<img width="1438" alt="스크린샷 2023-04-10 오후 10 58 27" src="https://user-images.githubusercontent.com/74294325/230925880-e23bcffb-c9a5-4868-9d7d-8c610e10a560.png">

<br>

## 인증서 자동 갱신

Let's Encrypt를 통해 인증서를 발급받으면 90일이 지나면 인증서가 만료된다. 그렇게 때문에 90일 주기마다 인증서를 재 발급을 해야한다. 이 또한 certbot을 통해 가능하다

<Br>

### 인증서 정보 확인

먼저 현재 certbot을 통해 받은 인증서 정보들을 보려면 아래와 같은 명령어를 입력하면 된다.

```bash
# command
certbot certificates

# result
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Found the following certs:
  Certificate Name: example.com
    Domains: example.com
    Expiry Date: 2023-07-08 08:53:05+00:00 (VALID: 88 days)
    Certificate Path: # key path
    Private Key Path: # key path
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

인증서 정보에서 `Expiry Date`가 해당 인증서가 만료되는 날짜이다.

<br>

### 인증서 재 발급

인증서 재 발급은 certbot을 통해 간단하게 진행할 수 있다. 또한 `--dry-run`명령어를 제공해주기 때문에 인증서를 **실제로 재발급하지 않고 해당 인증서를 재발급 하는 과정을 테스트 할 수 있다.**

인증서 재 발급은 `renew`라는 SUBCOMMAND를 이용하면 된다.

```bash
# command
certbot renew --dry-run # 실제로 재 발급 과정이 진행되는 것이 아닌 테스트 과정

# command
certbot renew # 이전에 발급받은 모든 인증서를 갱신한다.
```

<br>

## Reference

- https://eff-certbot.readthedocs.io/en/stable/index.html

- https://nginxstore.com/blog/nginx/lets-encrypt-%EC%9D%B8%EC%A6%9D%EC%84%9C%EB%A1%9C-nginx-ssl-%EC%84%A4%EC%A0%95%ED%95%98%EA%B8%B0/

- https://velog.io/@pinot/Ubuntu-18.04%EC%97%90%EC%84%9C-Lets-Encrypt%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%98%EC%97%AC-Nginx%EC%97%90-SSL%EC%9D%84-%EC%A0%81%EC%9A%A9%ED%95%98%EB%8A%94-%EB%B0%A9%EB%B2%95#5%EB%8B%A8%EA%B3%84---ssl-%EC%9E%90%EB%8F%99%EC%9C%BC%EB%A1%9C-%EA%B0%B1%EC%8B%A0%EC%8B%9C%ED%82%A4%EA%B8%B0
