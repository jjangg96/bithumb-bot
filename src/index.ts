import {Trade} from "./trade.ts";
import Users from "./users.json" assert {type: "json"};

(async () => {

    //118,996
    const user = Users;
    const trade = new Trade(user.connect_key, user.secret_key);
    setInterval(async () => {
        try {
            await trade.getOrderbookRange(user.coin).then(async (orderbookRange) => {
                if (orderbookRange[1] - orderbookRange[0] >= user.min_tick * 2) {
                    //targetPrice는 중간 값으로 설정
                    //const targetPrice = orderbookRange[0] + Math.ceil((orderbookRange[1] - orderbookRange[0]) / 2);
                    // const targetPrice = orderbookRange[0] + user.min_tick;
                    // console.log(targetPrice);
                    const amount = user.amount;

                    trade.sell(user.coin, orderbookRange[1] - user.min_tick, amount).then((r) => {
                        setTimeout(async () => {
                            if (!('error' in r)) await trade.cancel(r);
                        }, 3 * 1000);
                    });

                    trade.buy(user.coin, orderbookRange[0] + user.min_tick, amount).then((r) => {
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
            await trade.getOldestOrders(user.coin, 60).then(async (orders) => {
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
    }, 60 * 1000);


})();