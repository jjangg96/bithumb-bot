# 필요한 프로그램

* [Docker](https://www.docker.com/products/docker-desktop/)

# 빗썸 API 키 발급

[빗썸 API 키 발급](https://www.bithumb.com/react/api-support/management-api) 에서 `가상자산 출금` 제외하고 체크하셔서 발급받으면 됩니다.

* IP 및 출금 주소 제한 선택은 비워두세요.

# 수수료 무료 등록(필수)

[빗썸 수수료 무료 등록](https://www.bithumb.com/react/member/free-coupon-register)

# 실행

```bash
docker run --pull=always --rm -it -e CONNECT_KEY={Connect Key} -e SECRET_KEY={Secret key} jjangg96/bithumb-bot:latest
```

# 옵션을 바꿔서 실행

```bash
docker run --pull=always --rm -it -e CONNECT_KEY={Connect Key} -e SECRET_KEY={Secret key} -e COIN=SEI -e TICK=1 -e AMOUNT=15 jjangg96/bithumb-bot:latest
```

# ENV

| Env         | Description        | Default |
|-------------|--------------------|---------|
| CONNECT_KEY | 빗썸 API Connect Key | -       |
| SECRET_KEY  | 빗썸 API Secret Key  | -       |
| COIN        | 거래할 코인             | SEI     |
| TICK        | 최소 호가 단위           | 1       |
| AMOUNT      | 주문 수량 단위           | 15      |

# ChangeLog
* 기본 값 OSMO -> SEI
* 기본 Amount 값 늘림
* Tick에 Float도 사용 가능
* Amount에 랜덤 소숫점 2자리 추가
* 매수 1호가 위 호가에 매수(Maker) 주문을 내고 그 호가에 같은 수량 매도함