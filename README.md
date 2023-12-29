# Run

```bash
docker run --rm -it -e CONNECT_KEY={Connect Key} -e SECRET_KEY={Secret key} jjangg96/bithumb-bot:latest
docker run --rm -it -e CONNECT_KEY={Connect Key} -e SECRET_KEY={Secret key} -e COIN=OSMO -e TICK=1 -e AMOUNT=1 jjangg96/bithumb-bot:latest
```

# ENV

| Env         | Description        | Default |
|-------------|--------------------|---------|
| CONNECT_KEY | 빗썸 API Connect Key | -       |
| SECRET_KEY  | 빗썸 API Secret Key  | -       |
| COIN        | 거래할 코인             | OSMO    |
| TICK        | 최소 호가 단위           | 1       |
| AMOUNT      | 주문 수량 단위           | 1       |

# 빗썸 API 키 발급

[빗썸 API 키 발급](https://www.bithumb.com/react/api-support/management-api) 에서 가상자산 출금 제외하고 다 체크하고 발급받으면 됩니다.

* IP 및 출금 주소 제한 선택은 비워두세요.
