import WebSocket from 'ws';
import {Server} from "socket.io";

export class Orderbook {

    public coins: string[] = [];
    private wss: WebSocket;
    private socket: Server;

    constructor(socket: Server) {
        this.socket = socket;
        this.wss = new WebSocket('wss://pubwss.bithumb.com/pub/ws');
        this.wss.on('message', (data: string) => {
            const json = JSON.parse(data);
            if (json.type === 'orderbooksnapshot') {
                this.orderbookSnapshot(json.content);
            } else if (json.type === 'orderbookdepth') {
                this.orderbookDepth(json.content);
            } else {
                console.log(JSON.parse(data));
            }
        });
    }


    private orderbooks: {
        [coin: string]: {
            bid: number, ask: number
        }
    } = {};

    private targets: {
        [coin: string]: {
            bid: number,
            ask: number
        }
    } = {};

    private sendTargetPrice(coin: string, bid: number, ask: number) {
        const tick = 1 / Math.pow(10, this.findDigit(bid));
        if (ask - bid >= tick * 3) {

            let bidTarget, askTarget;

            if (`${bid}`.indexOf('.') >= 0 || `${ask}`.indexOf('.') >= 0) {
                //float
                bid = parseFloat(`${bid}`);
                ask = parseFloat(`${ask}`);
                // target = parseFloat(((ask + bid) / 2).toFixed(this.findDigit(bid)));
                const bidTick = parseFloat((bid + tick).toFixed(this.findDigit(bid)));
                const askTick = parseFloat((ask - tick).toFixed(this.findDigit(ask)));
                bidTarget = this.targets[coin] ? (this.targets[coin].bid === bid ? bid : bidTick) : bidTick;
                askTarget = this.targets[coin] ? (this.targets[coin].ask === ask ? ask : askTick) : askTick;
            } else {
                //int
                bid = parseInt(`${bid}`);
                ask = parseInt(`${ask}`);
                // target = Math.ceil((ask + bid) / 2);
                bidTarget = this.targets[coin] ? (this.targets[coin].bid === bid ? bid : bid + tick) : bid + tick;
                askTarget = this.targets[coin] ? (this.targets[coin].ask === ask ? ask : ask - tick) : ask - tick;
            }

            this.orderbooks[coin] = {
                bid,
                ask,
            }

            this.targets[coin] = {
                bid: bidTarget,
                ask: askTarget
            };
            // console.log(coin, bidTarget, askTarget);
            this.socket.emit(coin.toUpperCase(), this.targets[coin]);
        }


    }

    private orderbookDepth(content: any) {
        const bidAsks = content.list.reduce((acc: any, cur: {
            symbol: string,
            orderType: string,
            price: any
        }) => {
            const coin = cur.symbol.split('_')[0];
            let price = cur.price;
            if (price.indexOf('.') >= 0) {
                //float
                price = parseFloat(price)
            } else {
                //int
                price = parseInt(price);
            }

            if (this.orderbooks[coin]) {
                if (!acc[coin]) {
                    acc[coin] = {
                        bid: this.orderbooks[coin].bid,
                        ask: this.orderbooks[coin].ask,
                    }
                }

                if (cur.orderType === 'bid') {
                    if (acc[coin].bid < price) {
                        acc[coin].bid = price;
                    }
                } else if (cur.orderType === 'ask') {
                    if (acc[coin].ask > price) {
                        acc[coin].ask = price;
                    }
                }
            }

            return acc;
        }, {});

        for (const coin in bidAsks) {
            this.sendTargetPrice(coin, bidAsks[coin].bid, bidAsks[coin].ask);
        }
        //
        // for (const list of content.list) {
        //     const coin = list.symbol.split('_')[0];
        //
        //     if (this.orderbooks[coin]) {
        //         let price = list.price;
        //         if (price.indexOf('.') >= 0) {
        //             //float
        //             price = parseFloat(price)
        //         } else {
        //             //int
        //             price = parseInt(price);
        //         }
        //
        //         let bid = this.orderbooks[coin].bid;
        //         let ask = this.orderbooks[coin].ask;
        //
        //         if (list.orderType === 'bid') {
        //             if (this.orderbooks[coin].bid < price) {
        //                 bid = price;
        //             }
        //         } else if (list.orderType === 'ask') {
        //             if (this.orderbooks[coin].ask > price) {
        //                 ask = price;
        //             }
        //         }
        //
        //         this.sendTargetPrice(coin, bid, ask);
        //     }
        //
        // }
    }


    private orderbookSnapshot(content: any) {
        const coin = content.symbol.split('_')[0];
        let bid = content.bids[0][0];
        let ask = content.asks[0][0];

        // if (this.targets[coin] === bid) {
        //     bid = content.bids[1][0];
        // } else if (this.targets[coin] === ask) {
        //     ask = content.asks[1][0];
        // }

        this.sendTargetPrice(coin, bid, ask);
    }

    public addCoin(coin: string) {
        console.log('addCoin', this.coins, '<-', coin);
        coin = coin.toUpperCase();

        if (this.wss.readyState === WebSocket.OPEN && this.coins.indexOf(coin) < 0) {
            this.coins.push(coin);

            const orderbooksnapshot = JSON.stringify({
                "type": "orderbooksnapshot",
                "symbols": this.coins.map((coin) => `${coin}_KRW`)
            });
            this.wss.send(orderbooksnapshot);

            const orderbookdepth = JSON.stringify({
                "type": "orderbookdepth",
                "symbols": this.coins.map((coin) => `${coin}_KRW`)
            });
            this.wss.send(orderbookdepth);
        }

    }

    private findDigit(bid: number) {
        if (bid < 1) {
            return 4;
        } else if (bid < 10) {
            return 3;
        } else if (bid < 100) {
            return 2;
        } else {
            return 0;
        }
    }

}