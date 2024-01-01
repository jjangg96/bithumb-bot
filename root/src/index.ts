import {Trade} from "./trade.ts";
import {io} from "socket.io-client";

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

    if (!connectKey || !secretKey) throw new Error('CONNECT_KEY or SECRET_KEY is empty');

    const trade = new Trade(connectKey, secretKey);

    const socket = io('http://ws.0base.vc:30332');
    // const socket = io('http://localhost:30332');
    socket.on('connect', () => {
        console.log('connected');
        socket.emit('COIN', coin.toUpperCase());
    });
    socket.on('disconnect', () => {
        console.log('disconnected');
    });
    socket.on(`${coin.toUpperCase()}`, async ({bid, ask}) => {
        try {
            trade.buy(coin, bid, amount).then((r) => {
                setTimeout(async () => {
                    if (!('error' in r)) await trade.cancel(r);
                }, 10 * 1000);
            });

            trade.sell(coin, ask, amount).then((r) => {
                setTimeout(async () => {
                    if (!('error' in r)) await trade.cancel(r);
                }, 10 * 1000);
            });
        } catch (e) {
            console.log(e);
        }
    });


    // setInterval(async () => {
    //     try {
    //         await trade.getOrderbookRange(coin).then(async (orderbookRange) => {
    //             if (orderbookRange[1] - orderbookRange[0] >= tick * 2) {
    //                 //targetPrice는 중간 값으로 설정
    //                 //const targetPrice = orderbookRange[0] + Math.ceil((orderbookRange[1] - orderbookRange[0]) / 2);
    //                 let targetPrice: number = orderbookRange[0] + tick;
    //                 if (`${targetPrice}`.indexOf('.') >= 0) {
    //                     targetPrice = parseFloat(targetPrice.toFixed(findDigit(targetPrice)));
    //                 }
    //                 // console.log(targetPrice);
    //
    //                 // 랜덤 4자리 1보다 작은 소숫점 숫자
    //                 const randomDecimal = Number(Math.random().toFixed(findDigit(targetPrice)));
    //
    //
    //                 trade.buy(coin, targetPrice, amount + randomDecimal).then((r) => {
    //                     setTimeout(async () => {
    //                         if (!('error' in r)) await trade.cancel(r);
    //                     }, 1000);
    //                 });
    //
    //                 trade.sell(coin, targetPrice, amount + randomDecimal).then((r) => {
    //                     setTimeout(async () => {
    //                         if (!('error' in r)) await trade.cancel(r);
    //                     }, 1000);
    //                 });
    //
    //             }
    //         });
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }, 200);

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