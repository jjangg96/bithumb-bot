import {Trade} from "./trade.ts";

(async () => {
    const getEnv = (key: string, defaultValue: string | number) => {
        const value = process.env[key];
        if (value === undefined) return defaultValue;
        if (typeof defaultValue === 'number') {
            if (value.indexOf('.') >= 0) return parseFloat(value)
            else return parseInt(value)
        }
        return value;
    }

    const connectKey: string = getEnv('CONNECT_KEY', '') as string;
    const secretKey: string = getEnv('SECRET_KEY', '') as string;
    const coin: string = getEnv('COIN', 'SEI') as string;
    const amount: number = getEnv('AMOUNT', 30) as number;
    const tick: number = getEnv('TICK', 1) as number;

    if (!connectKey || !secretKey) throw new Error('CONNECT_KEY or SECRET_KEY is empty');

    const trade = new Trade(connectKey, secretKey);
    setInterval(async () => {
        try {
            await trade.getOrderbookRange(coin).then(async (orderbookRange) => {
                if (orderbookRange[1] - orderbookRange[0] >= tick * 2) {
                    //targetPrice는 중간 값으로 설정
                    //const targetPrice = orderbookRange[0] + Math.ceil((orderbookRange[1] - orderbookRange[0]) / 2);
                    const targetPrice = orderbookRange[0] + tick;
                    // console.log(targetPrice);

                    // 랜덤 4자리 1보다 작은 소숫점 숫자
                    const randomDecimal = Number(Math.random().toFixed(2));


                    trade.buy(coin, targetPrice, amount + randomDecimal).then((r) => {
                        setTimeout(async () => {
                            if (!('error' in r)) await trade.cancel(r);
                        }, 3 * 1000);
                    });

                    trade.sell(coin, targetPrice, amount + randomDecimal).then((r) => {
                        setTimeout(async () => {
                            if (!('error' in r)) await trade.cancel(r);
                        }, 3 * 1000);
                    });

                }
            });
        } catch (e) {
            console.log(e);
        }
    }, 100);

    setInterval(async () => {
        try {
            //cancel
            await trade.getOldestOrders(coin, 30).then(async (orders) => {
                if (orders) {
                    console.log(orders.map((order) => order.id.substring(order.id.length - 4)).sort());
                    for (const order of orders) {
                        await trade.cancel(order);
                    }

                }
            });
        } catch (e) {
            console.log(e);
        }
    }, 30 * 1000);


})();