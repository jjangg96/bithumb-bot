import {Trade} from "./trade.ts";
import {io} from "socket.io-client";

(async () => {
    console.log('bithumb-bot 유저 단톡방 : https://open.kakao.com/o/gfpU2E1f');
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
    const status: string = getEnv('STATUS', 'START') as string;
    const queueExecutor: number = getEnv('QUEUE_EXECUTOR', 1) as number;

    if (!connectKey || !secretKey) throw new Error('CONNECT_KEY or SECRET_KEY is empty');

    const trade = new Trade(connectKey, secretKey);
    let queue: any = [];
    const queueTypes = () => {
        return queue.reduce((acc: any, cur: any) => {
            if (acc[cur.type] === undefined) acc[cur.type] = 0;
            acc[cur.type]++;
            return acc;
        }, {})
    };
    const balances: { [coin: string]: number } = {};

    const socket = io('http://ws.0base.vc:30332');
    // const socket = io('http://localhost:30332');
    socket.on('connect', () => {
        console.log('connected');
        socket.emit('COIN', coin.toUpperCase());
    });
    socket.on('disconnect', () => {
        console.log('disconnected');
    });
    socket.on(`${coin.toUpperCase()}`, async ({bid, ask}: { bid: string, ask: string }) => {

        if (status === 'STOP') return;

        if (queueTypes()['BALANCE'] < 1 || queueTypes()['BALANCE'] === undefined) {
            addQueue({
                type: 'BALANCE',
                coin: coin
            });
        }

        if (balances['KRW'] >= parseFloat(bid) * amount) {
            addQueue({
                type: 'BUY',
                coin: coin,
                price: bid,
                amount: amount,
            });
        }

        if (balances[coin] >= amount) {
            addQueue({
                type: 'SELL',
                coin: coin,
                price: ask,
                amount: amount,
            });
        }
    });

    const addQueue = (item: any) => {
        item.date = new Date();
        queue.push(item);

    }

    setInterval(async () => {
        if (queue.length > 10) {
            //queue.type별로 length 출력
            console.log(new Date(), 'Queue Length', queue.length, queueTypes());
        }
    }, 60 * 1000);

    const toBithumb = async (order: any) => {
        if (order.type === 'BALANCE') {
            const totalBalances = await trade.getBalance();
            balances['KRW'] = totalBalances.KRW.free as number
            balances[order.coin] = totalBalances[order.coin].free as number;
        } else if (order.type === 'BUY' && order.coin && order.price && order.amount) {
            trade.buy(order.coin, order.price, order.amount).then(() => {
            });
        } else if (order.type === 'SELL' && order.coin && order.price && order.amount) {
            trade.sell(order.coin, order.price, order.amount).then(() => {
            });
        } else if (order.type === 'CANCEL' && order.order) {
            trade.cancelUnifiedOrder(order.order).then(() => {
            });
        } else if (order.type === 'CANCEL_ALL') {
            //cancel
            trade.getOldestOrders(coin, 5).then(async (orders) => {
                if (orders) {
                    // console.log(orders.map((order) => order.id.substring(order.id.length - 4)).sort());
                    for (const order of orders) {
                        addQueue({
                            type: 'CANCEL',
                            order: order
                        });
                    }
                }
            });
        }
    }

    const nextBithumb = async () => {
        let order = queue.shift();
        if (order) {
            if (order.type === 'BUY' || order.type === 'SELL') {
                if (order.date && new Date().getTime() - order.date.getTime() > 1000 * 2) {
                    order = queue.shift();
                }
            }
            if (order) await toBithumb(order);
        }
    }

    setInterval(async () => {
        try {
            for (let i = 0; i < queueExecutor; i++) {
                await nextBithumb();
            }
        } catch (e) {
            console.log(e);
        }
    }, 1000);

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
            if (queueTypes()['CANCEL_ALL'] < 1 || queueTypes()['CANCEL_ALL'] === undefined) {
                addQueue({
                    type: 'CANCEL_ALL'
                });
            }
        } catch (e) {
            console.log(e);
        }
    }, 5 * 1000);
})();