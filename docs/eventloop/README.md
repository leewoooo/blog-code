# Node.js의 Event Loop

## Node.js의 구조

Node를 **싱글 스레드 논 블로킹**이라고 한다. Node는 하나의 스레드로 동작하지만 `I/O`작업이 발생하는 경우 해당 작업을 **비동기적으로 처리할 수 있다.**

분명 **하나의 스레드로 동작했다.** 하지만 어떻게 `I/O`작업이 발생하는 경우 해당작업을 **비동기로 처리할 수 있을까?** 이것을 이해하기 위해서는 Node의 구조를 먼저 알아야 한다.

![eventloop](https://user-images.githubusercontent.com/74294325/184080118-04c8793f-9c33-4cd5-81bf-381339b8533e.png)

### V8

Node는 C++로 작성된 런타임이고 그 내부에는 `V8 Engine`을 가지고 있다. `V8 Engine`를 통해 브라우저에서만 실행이 가능했던 `javascript`를 로컬에서 실행을 할 수 있게 된 것이다.

<br>

### libuv

이벤트 루프를 이해하기 위해서 필수로 이해해야 하는 부분이 `libuv`이다. `libuv`는 `C`로 작성되었으며 운영체제의 커널을 추상화한 라이브러리이다. **중요한 것은 Node가 사용하는 비동기 `I/O` 라이브러리라는 것이다.**

결론부터 이야기하자면 Node가 하나의 스레드로 비동기 처리가 가능한 이유가 `libuv`를 사용하기 때문이다.

Node는 **`I/O`작업을 자신의 메인 스레드가 아니라 다른 스레드에 위임함으로 싱글 스레드로 논블로킹 비동기 작업을 지원할 수 있게 되는 것이다.** 즉 Node는 `I/O`작업을 `libuv`에 위임함으로 `논블로킹 비동기 작업을 지원한다.`

운영체제를 추상화 하였기 때문에 `libuv`는 Node에서 처리하고자 하는 비동기 작업이 **운영체제에서 지원을 하는 것인지, 지원하는 것이 아닌지 판단이 가능하다.**

그렇기 때문에 비동기 작업 요청이 들어왔을 때 아래와 같이 처리를 하게 된다.

```ts
if (운영체제에서 지원하는 비동기 작업) {
  libuv가 대신 커널에 비동기로 요청을 했다가 응답이 오면 응답을 전달해준다.
  (응답이 전달될 때는 OS가 systemcall을 통해 callback이 이벤트 루프에 등록.)
} else {
  워커 쓰레드가 담긴 자신만의 쓰레드 풀을 이용하여 작업을 처리
}
```

![libuv](https://user-images.githubusercontent.com/74294325/184083014-1ad520d0-c4d3-45e6-92d6-1457a42ea081.png)

<br>

### 정리

- `libuv`는 운영체제의 커널을 추상화 하여 비동기 작업을 지원한다.

- `libuv`는 커널에서 어떠한 비동기 작업을 지원해주는지 알고 있다.

- 비동기 작업이 커널에서 지원을 하면 `libuv`가 대신하여 커널에 요청하고 지원하지 않는다면 `libuv` 내부적인 `Thread Poll`을 이용하여 작업을 처리한다.

<br>

## 이벤트 루프 **구조**

이벤트 루프는 6개의 Phase를 가지고 있다. 각 단계에는 **해당 페이즈에서 처리해야 하는 `callback`을 담을 수 있는 `Queue`를 가지고 있다.**

이벤트 루프가 각 Phase에 진입을 하게 되면 해당 `Queue`에 있는 작업들을 **동기적으로 실행하게 된다.** `Queue`가 비워지거나 **시스템 한도를 초과하지 않을 때 까지** 실행 후 다음 Phase로 넘어간다.

<br>

![eventloop_structure](https://user-images.githubusercontent.com/74294325/184755067-d40fa6c7-e625-46ce-b530-0bf64d9e2037.png)

`javascript` 코드는 `Idle, Prepare Phase`를 제외한 어느 단계에서든 실행될 수 있다.

위의 그림에서 `nextTickQueue`와 `microTaskQueue`는 **이벤트 루프 일부는 아니지만 Node의 비동기 작업 관리를 도와주는 것들이다.**

<br>

### Timer Phase

Timer Phase는 이벤트 루프의 시작을 알리는 Phase이다. 이 Phase에서는 `setTimeout`과 `setInterval`의 콜백이 저장된다.

이 Phase에 타이머들의 **콜백이 바로 Queue에 쌓이는 것이 아니다.** 타이머는 `min-heap`에 유지하고 있다가 해당 타이머가 **실행이 가능할 때 `Queue`에 넣고 실행한다.**

<br>

### Pending Callbacks Phase

Pending Callbacks Phase는 `pending_queue`에 있는 콜백을 실행한다.

`pending_queue`에 들어가는 콜백들은 **현재 돌고 있는 이벤트 루프 이전에 한 작업에서 `Queue`에 들어온 콜백들이다.** (예를 들어 **시스템 실행한도에 의해 실행되지 못한 콜백들이 해당 `Queue`에 들어오게 된다.**)

<br>

### Idle, Prepare Phase

Idle는 매 Tick 마다 실행하며, Prepare는 매 Polling 마다 실행한다. 이 Phase는 이벤트 루프에 직접 연관되어 있다고 보기에는 힘들며 Node 내부적인 관리를 위한 Phase이다.

<br>

### Poll Phase

이벤트 루프 중 가장 중요한 단게이다. **새로운 `I/O`이벤트를 다루며 `watcher_queue`의 콜백을 실행한다.**

`watcher_queue`에 담기는 콜백은 예를 들어 아래와 같다.

1. DB에 Query를 보내고 응답이 왔을 때 콜백
2. HTTP 요청을 보내고 응답이 왔을 때 콜백
3. 파일을 비동기로 읽고 다 읽었을 때 콜백

Poll Phase는 그럼 어떻게 **새로운 `I/O`이벤트를 다룰까?**

`I/O`이벤트는 타이머와 달리 `Queue`에 담긴 순서대로 `I/O`작업이 완료된다는 보장이 없다. 예를들어 DB에 A, B 쿼리를 순서대로 날려도 응답은 B, A 순서대로 올 수 있다.

A를 B보다 먼저 실행하기 위해 A 응답이 올 때 까지 B 콜백처리를 미루는 것도 비효율 적이다.

위의 문제를 해결하기 위해서 Poll Phase는 단순한 콜백 `Queue`를 사용하지 않는다.

이벤트 루프가 n개의 열린 소켓을 가지고 있고 n개의 완료되지 않은 요청이 있다고 했을 때. 이 n개의 소켓에 대해 소켓과 메타 데이터를 가진 watcher를 관리하는 큐가 watcher_queue다.

그리고 각 watcher는 FD(File Descriptor를 가지고 있다. 이 FD는 네트워크 소켓, 파일 등등을 가리킨다.

운영 체제가 FD가 준비되었다고 알리면 이벤트 루프는 이에 해당하는 watcher를 찾을 수 있고 watcher가 맡고 있던 콜백을 실행할 수 있게 되는 것이다.

<br>

### Check Phase

Check Phase는 오직 `setImmediate`의 콜백만을 위한 Phase이다. `setImmediate`가 실행되면 콜백이 Check Phase에 쌓이게 되고 이벤트 루프가 해당 Phase에 진입했을 때 `Queue`에 있는 작업들을 실행한다.

<br>

### Close Callbacks Phase

Clase Callbacks Phase는 `socket.on('close',() => {})`와 같은 `close` 이벤트 타입의 핸들러를 처리하는 페이즈 이다.

정확하게는 `uv_close()`를 부르면서 종료된 핸들러의 콜백들을 처리하는 Phase이다.

<br>

### nextTickQueue, microTaskQueue

nextTickQueue는 `process.nextTick()` API 콜백들이 쌓이게 되며, `microTaskQueue`는 `Resolved` 된 `Promise` 콜백이 쌓이게 된다.

위에서도 이야기 했지만 이 2개의 `Queue`는 기술적으로 **이벤트 루프가 아니다. `libuv`에 포함된 것이 아니라 Node에 포함된 기술들이다.**

<br>

## 이벤트 루프 **흐름**

위에서는 각 Phase 및 `Queue`들이 어떠한 역할을 하는지 정리해보았다. 이제 코드의 실행 흐름을 보기 원한다.

![eventloop_flow](https://user-images.githubusercontent.com/74294325/184751460-e3e523f3-e44a-4cf5-9d96-2f915195a915.png)

1. `main.js`를 Node 환경에서 실행을 시키면 Node는 **먼저 이벤트 루프를 생성한다.** 이 때 `main.js`가 비동기작업을 가지고 있지 않아도 생성된다.

2. 생성 후 **이벤트 루프 밖에 `main.js`의 코드를 실행한다.**

3. 코드를 실행한 결과 **이벤트 루프가 살아있는지 확인을 한다.** 여기서 살아있는지 확인한다는 것은 **이벤트 루프 안에서 처리해야할 작업들의 존재여부가 된다.**

4. 만약 이벤트 루프 안에서 처리해야할 작업이 없다면 Node는 이벤트 루프를 종료한다.

5. 만약 이벤트 루프 안에서 처리해야할 작업이 있다면 Node는 이벤트 루프의 첫 페이즈인 Timer Phase에 진입한다.

6. Close Callbacks Phase 이 후 다시 이벤트 루프가 살아있는지 확인하게 된다.

이제 각 페이즈를 흐름에 따라 조금 더 자세히 살펴보기를 원한다.

<br>

### Timer Phase

앞에서 이야기 했듯이 Timer Phase는 타이머를 `min-heap`을 통해 관리를 한다. **힙을 구성하는 시점에서 실행시간이 가장 적게 남은 타이머가 힙의 루트가 된다.**

이벤트 루프가 Timer Phase에 진입을 하게 되면 타이머들의 `now - registedTime >= delta`를 검사하게 된다. 여기서 `delta`는 `setTimeout()`의 두번 째 인자로 넣은 시간이 된다.

위의 조건에 맞는 타이머들의 콜백이 Queue에 들어가게 되며 이벤트 루프에 의해 하나씩 실행되게 된다.

그 후 다시 타이머들을 관리하는 `min-heap`을 재구성하게 된다.

> `min-heap`<br> 부모 노드의 키 값이 자식 노드의 키 값보다 작거나 같은 완전 이진 트리를 이야기한다.

<br>

### Pending I/O Phase

해당 페이즈에 진입하면 **이전 작업들의 콜백이 실행 대기 중인지(실행이 가능한지) 확인한다.**

즉 Pending Queue에 들어와 있는 작업이 있는지 확인한다. 확인 후 작업들이 있다면 Queueu가 비거나 시스템 실행한도 까지 실행 후 다음 페이즈로 넘어간다.

<br>

### Poll Phase

이벤트 루프가 해당 페이즈에 들어왔을 때 `watcher_queue` 내부에 파일 읽기, HTTP, DB 등등.. 에 대한 콜백을 실행한다.

만약 `watcher_queue`에 **더 이상 실행해야 할 작업들이 없다면?**

Poll Phase는 다른 페이즈와는 다르게 바로 다음 페이즈로 넘어가지 않는다.

먼저는

1. check_queue, pending_queue, close_callback_queue에 해야할 작업이 있는지 검사한다.

2. 작업이 있다면 Poll Phase가 종료되고 바로 다음 페이즈로 넘어간다.

3. 작업이 없다면 다음 페이즈로 넘어가지 않고 대기한다.

여기서 Poll Phase가 대기하는 것을 조금 더 자세히 살펴보면 대기를 한다고 해서 **무한정 대기하는 것은 아니다.**

타이머를 관리하는 `min-heap`에서 첫번째 타이머를 꺼내 지금 실행할 수 있는 상태인지 확인을 한다.

지금 실행할 수 있는 상태라면 그 해당 타이머의 시간만큼 대기 후 다음 페이즈로 넘어간다. (간단히 n초 후 실행할 수 있는 타이머가 있다면 n초 대기를 한다.)

그 이유는 **다음 페이즈로 넘어가도 실행할 수 있는 타이머가 없기 때문에 이벤트 루프는 계속해서 작업없이 도는 것을 방지하기 위해서이다.**

<br>

### Check Phase

이 페이즈는 설명과 크게 다르지 않다. `setImmediate()`의 콜백들이 쌓인 Queueu가 비거나 시스템 실행한도 까지 실행 후 다음 페이즈로 넘어간다.

<br>

### Close Callback Phase

uv_close()를 부르면서 종료된 핸들러의 콜백들을 처리하는 Phase이다.

이벤트 루프가 Close Callback Phase의 작업들과 함께 종료가 되면 그 때 이벤트 루프가 살아있는지 확인하게 된다.

동일하게 이벤트 루프에서 처리할 작업이 남아있으면 이벤트 루프를 종료하지 않고 다시 Timer Phase로 넘어간다.

하지만 이벤트 루프가 살아있지 않으면 이벤트 루프를 종료한다.

<br>

## 그럼 nextTickQueue와 microTaskQueue는?

그럼 이 2개의 Queue는 언제 실행될까?

**이 2개의 Qeueu는 어떤 페이즈에서 다음 페이즈로 넘어가기 전에 자신이 가지고 있는 콜백들을 최대한 빨리 실행하는 역할을 맞고 있다.**

2개의 Queue는 **시스템 실행한도의 영향을 받지 않는다.** 이 말은 해당 Queue가 비워질 때 까지 작업들이 계속해서 실행되며 만일 계속해서 쌓인다면 **갇힐 수 있다는 것이다.**

nextTickQueue가 microTaskQueue보다 우선순위가 높기 때문에 nextTickQueue에 있는 작업들이 더 먼저 실행된다.

<br>

###

## REFERENCES

- https://github.com/libuv/libuv

- https://www.voidcanvas.com/nodejs-event-loop/

- https://www.korecmblog.com/node-js-event-loop/?fbclid=IwAR2egQu68z0zDTFCulfB4WvMA6Ons6LwYRYtFKIQ6uE8BQh3U0wLvK9qvOg#check-phase
