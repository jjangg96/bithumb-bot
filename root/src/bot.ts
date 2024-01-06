import {io} from "socket.io-client";
import {Env} from "./env.js";
import {Trade} from "./trade.js";

export class Bot {
    private trade: Trade;
    private queue: any[] = [];
    private balances: { [coin: string]: number } = {};
    private readonly coin: string;
    private readonly amount: number;
    private readonly status: string;
    private readonly thread: number;

    constructor(connectKey: string, secretKey: string) {
        this.trade = new Trade(connectKey, secretKey);
        this.coin = Env.GetEnv('COIN', 'BTC') as string;
        this.amount = Env.GetEnv('AMOUNT', 0.0001) as number;
        this.status = Env.GetEnv('STATUS', 'START') as string;
        this.thread = Env.GetEnv('QUEUE_EXECUTOR', 20) as number;
    }


    private addQueue(item: any) {
        item.date = new Date();
        this.queue.push(item);
    }

    private async handleBalanceOrder(order: any) {
        const totalBalances = await this.trade.getBalance();
        this.balances['KRW'] = totalBalances.KRW.free as number
        this.balances[order.coin] = totalBalances[order.coin].free as number;
    }

    private async handleBuyOrder(order: any) {
        if (order.coin && order.price && order.amount) {
            this.trade.buy(order.coin, order.price, order.amount).then(() => {
            });
        }
    }

    private async handleSellOrder(order: any) {
        if (order.coin && order.price && order.amount) {
            this.trade.sell(order.coin, order.price, order.amount).then(() => {
            });
        }
    }

    private async handleCancelOrder(order: any) {
        if (order.order) {
            this.trade.cancelUnifiedOrder(order.order).then(() => {
            });
        }
    }

    private async handleCancelAllOrder() {
        this.trade.getOldestOrders(this.coin, 7).then(async (orders) => {
            if (orders) {
                for (const order of orders) {
                    this.addQueue({
                        type: 'CANCEL',
                        order: order
                    });
                }
            }
        });
    }

    private async processOrder(order: any) {
        switch (order.type) {
            case 'BALANCE':
                await this.handleBalanceOrder(order);
                break;
            case 'BUY':
                await this.handleBuyOrder(order);
                break;
            case 'SELL':
                await this.handleSellOrder(order);
                break;
            case 'CANCEL':
                await this.handleCancelOrder(order);
                break;
            case 'CANCEL_ALL':
                await this.handleCancelAllOrder();
                break;
        }
    }

    private async next() {
        let order = this.queue.shift();
        if (order) {
            if (this.thread <= 1 && order.type === 'BUY' || order.type === 'SELL') {
                if (order.date && new Date().getTime() - order.date.getTime() > 1000) {
                    order = this.queue.shift();
                }
            }
            if (order) await this.processOrder(order);
        }
    }

    private async executeQueue() {
        for (let i = 0; i < this.thread; i++) {
            await this.next();
        }
    }

    private printQueueStatus() {
        if (this.queue.length > 10) {
            console.log(new Date(), 'Queue Length', this.queue.length, this.getQueueCount());
        }
    }

    private getQueueCount(type: string | undefined = undefined) {
        const types = this.queue.reduce((acc: any, cur: any) => {
            if (acc[cur.type] === undefined) acc[cur.type] = 0;
            acc[cur.type]++;
            return acc;
        }, {});

        if (type) return types[type];
        return types;
    }

    private setupSocketEvents(socket: any) {
        socket.on('connect', () => {
            console.log('Server Connected');
            socket.emit('COIN', this.coin.toUpperCase());
        });
        socket.on('disconnect', () => {
            console.log('Server Disconnected');
        });
        socket.on(`${this.coin.toUpperCase()}`, async ({bid, ask}: { bid: string, ask: string }) => {
            if (this.status === 'STOP') return;

            if (this.getQueueCount('BALANCE') < this.thread || this.getQueueCount('BALANCE') === undefined) {
                this.addQueue({
                    type: 'BALANCE',
                    coin: this.coin
                });
            }

            if (this.balances['KRW'] >= parseFloat(bid) * this.amount) {
                this.addQueue({
                    type: 'BUY',
                    coin: this.coin,
                    price: bid,
                    amount: this.amount,
                });
            }

            if (this.balances[this.coin] >= this.amount) {
                this.addQueue({
                    type: 'SELL',
                    coin: this.coin,
                    price: ask,
                    amount: this.amount,
                });
            }
        });
    }

    private setupIntervalTasks() {
        setInterval(async () => {
            try {
                if (this.getQueueCount('CANCEL_ALL') < this.thread || this.getQueueCount('CANCEL_ALL') === undefined) {
                    this.addQueue({
                        type: 'CANCEL_ALL'
                    });
                }
            } catch (e) {
                console.log(e);
            }
        }, 7 * 1000);

        setInterval(async () => {
            try {
                await this.executeQueue();
            } catch (e) {
                console.log(e);
            }
        }, 1000 / this.thread);

        setInterval(async () => {
            this.printQueueStatus();
        }, 60 * 1000);

        setInterval(async () => {
            await this.trade.updateUserTicker(this.coin);
        }, 1000);
    }

    public async start() {
        this.trade.initUserTicker(this.coin);

        const targetVolume: number = Env.GetEnv('TARGET_VOLUME', -1) as number;
        if (targetVolume > 0) {
            console.log(`${targetVolume}억, 목표 거래량 설정`);
            setInterval(() => {
                if (this.trade.getTotalVolume() >= targetVolume * 100000000) {
                    console.log(`${targetVolume}억, 목표 거래량 도달에 의한 종료`);
                    process.exit(0);
                }

            }, 60 * 1000);
        }

        const socket = io('http://ws.0base.vc:30332');
        this.setupSocketEvents(socket);
        this.setupIntervalTasks();
    }
}