import {bithumb as Bithumb, Order} from 'ccxt';
import numeral from 'numeral';
import {Env} from "./env.js";

export class Trade {

    private readonly bithumb: Bithumb;
    private readonly DEBUG;
    private readonly startAt = new Date().getTime();
    private initialUserTicker: {
        averagePrice: number,
        volume: number,
    } = {
        averagePrice: 0,
        volume: 0,
    };
    private currnetUserTicker: {
        averagePrice: number,
        volume: number,
    } = {
        averagePrice: 0,
        volume: 0,
    };


    constructor(apiKey: string, secret: string) {
        this.DEBUG = ((Env.GetEnv('DEBUG', 'false') as string).toLowerCase().trim() === 'true');
        this.bithumb = new Bithumb({
            apiKey,
            secret,
            enableRateLimit: false,
        });
    }

    private log(...args: any[]) {
        const traded = this.currnetUserTicker.volume - this.initialUserTicker.volume;
        const diffSec = (new Date().getTime() - this.startAt) / 1000;
        const tradePerSec = traded / diffSec / 10000;
        const avgTradePerSec = this.currnetUserTicker.volume / 10000 / (60 * 60 * 24);
        const status = `[${numeral(this.currnetUserTicker.volume / 100000000).format('0,0.0')}/${numeral(traded / 10000).format('0,0')}/${numeral(tradePerSec).format('0,0.0')}${tradePerSec >= avgTradePerSec ? '>' : '<'}${numeral(avgTradePerSec).format('0,0.0')}]`;
        console.log(new Date(), ...args, status);
    }

    public initUserTicker(coin: string) {
        this.updateUserTicker(coin).then((r) => {
            this.initialUserTicker = r;
        });
    }

    public async updateUserTicker(coin: string) {
        return this.bithumb.privatePostInfoTicker({
            order_currency: coin,
            payment_currency: 'KRW',
        }).then((r) => {
            const current = {
                averagePrice: Number(r.data.average_price),
                volume: Number(r.data.units_traded) * Number(r.data.average_price),
            }
            this.currnetUserTicker = current;
            return current;
        }).catch((_e) => {
            return {
                averagePrice: 0,
                traded: 0,
                volume: 0,
            }
        });
    }

    public getTotalVolume() {
        return this.currnetUserTicker.volume;
    }


    public async buy(coin: string, price: string, amount: number) {
        //buy coin in bithumb with ccxt
        coin = `${coin}/KRW`;
        return this.bithumb.createOrder(coin, 'limit', 'buy', amount, price).then(r => {
            this.log('BUY ', coin, numeral(price).format('0,0[.]0'), amount);
            return r
        }).catch((e) => {
            if (this.DEBUG) this.log('BUY ', coin, numeral(price).format('0,0[.]0'), amount, e);
            else if (e.message.indexOf('Too Many') >= 0) this.log('BUY ', coin, numeral(price).format('0,0[.]0'), amount, 'Rate limited');
            else if (e.message.indexOf('잔액') === -1 && e.message.indexOf('초과') === -1) this.log('BUY ', coin, numeral(price).format('0,0[.]0'), amount, e);
            return {
                error: e.message,
            };
        });
    }

    public async sell(coin: string, price: string, amount: number) {
        //sell coin in bithumb with ccxt
        coin = `${coin}/KRW`;
        return this.bithumb.createOrder(coin, 'limit', 'sell', amount, price).then(r => {
            this.log('SELL', coin, numeral(price).format('0,0[.]0'), amount);
            return r
        }).catch((e) => {
            if (this.DEBUG) this.log('SELL', coin, numeral(price).format('0,0[.]0'), amount, e);
            else if (e.message.indexOf('Too Many') >= 0) this.log('SELL', coin, numeral(price).format('0,0[.]0'), amount, 'Rate limited');
            else if (e.message.indexOf('잔액') === -1 && e.message.indexOf('초과') === -1) this.log('SELL', coin, numeral(price).format('0,0[.]0'), amount, e);
            return {
                error: e.message,
            };
        });
    }

    public async cancelUnifiedOrder(order: Order) {
        //cancel order in bithumb with ccxt
        // this.log('Cancel', order.symbol, order.datetime, order.price, order.side, order.id);
        return this.bithumb.cancelUnifiedOrder(order).then((_r) => {
            // this.log('Cancel Done', order.id.substring(order.id.length-4));
        }).catch((_e) => {
            // this.error('Cancel Error', order.id.substring(order.id.length-4), order.price, e.message);
        });
    }

    public async cancel(id: string, symbol: string, side: string) {
        //cancel order in bithumb with ccxt
        // this.log('Cancel', order.symbol, order.datetime, order.price, order.side, order.id);
        return this.bithumb.cancelOrder(id, symbol, {type: side}).then((_r) => {
            // this.log('Cancel Done', order.id.substring(order.id.length-4));
        }).catch((_e) => {
            // this.error('Cancel Error', order.id.substring(order.id.length-4), order.price, e.message);
        });
    }

    public async cancelAll(coin: string) {
        //cancel all order in bithumb with ccxt
        return this.bithumb.fetchOpenOrders(coin).then((orders) => {
            for (const order of orders) {
                this.cancelUnifiedOrder(order);
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

    public async getBalance() {
        //get current price in bithumb with ccxt
        return (await this.bithumb.fetchBalance());
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