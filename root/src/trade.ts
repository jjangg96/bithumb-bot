import {bithumb as Bithumb, Order} from 'ccxt';

export class Trade {

    private readonly bithumb: Bithumb;

    constructor(apiKey: string, secret: string) {
        this.bithumb = new Bithumb({
            apiKey,
            secret,
            enableRateLimit: false,
        });
    }

    public async buy(coin: string, price: number, amount: number) {
        //buy coin in bithumb with ccxt
        return this.bithumb.createOrder(coin, 'limit', 'buy', amount, price).then(r => {
            console.log(new Date(), 'Buy', coin, price, amount);
            return r
        }).catch((e) => {
            return {
                error: e.message,
            };
        });
    }

    public async sell(coin: string, price: number, amount: number) {
        //sell coin in bithumb with ccxt
        return this.bithumb.createOrder(coin, 'limit', 'sell', amount, price).then(r => {
            console.log(new Date(), 'Sell', coin, price, amount);
            return r
        }).catch((e) => {
            return {
                error: e.message,
            };
        });
    }

    public async cancel(order: Order) {
        //cancel order in bithumb with ccxt
        // console.log(new Date(), 'Cancel', order.symbol, order.datetime, order.price, order.side, order.id);
        return this.bithumb.cancelUnifiedOrder(order).then((_r) => {
            // console.log('Cancel Done', order.id.substring(order.id.length-4));
        }).catch((_e) => {
            // console.error('Cancel Error', order.id.substring(order.id.length-4), order.price, e.message);
        });
    }

    public async cancelAll(coin: string) {
        //cancel all order in bithumb with ccxt
        return this.bithumb.fetchOpenOrders(coin).then((orders) => {
            for (const order of orders) {
                this.cancel(order);
            }
        });
    }

    public async getOldestOrders(coin: string, sec: number) {
        //get orders in bithumb with ccxt
        return this.bithumb.fetchOpenOrders(coin).then((orders) => {
            if (orders.length === 0) return null;
            return orders.filter((order) => {
                return (Date.now() - order.timestamp) / 1000 > sec;
            });
        });
    }

    public async currentPrice(coin: string) {
        //get current price in bithumb with ccxt
        return (await this.bithumb.fetchTicker(coin)).last;
    }

    public async getBalance(coin: string) {
        //get current price in bithumb with ccxt
        return (await this.bithumb.fetchBalance())[coin].free;
    }

    public async getOrderbookRange(coin: string) {
        //get current price in bithumb with ccxt
        try {
            const r = await this.bithumb.fetchOrderBook(coin, 1);
            return [r.bids[0][0] as number, r.asks[0][0] as number];
        } catch {
            return [0, 0];
        }
    }
}