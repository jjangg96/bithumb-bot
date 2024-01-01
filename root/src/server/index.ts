import {Server} from 'socket.io'
import {Orderbook} from "./orderbook.ts";

(async () => {


    const io = new Server(30332, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        //socket 에서 ip 가져오기
        const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
        console.log(`${ip} user connected`);
        socket.on('disconnect', () => {
            console.log(`${ip} user disconnected`);
        });

        socket.on('COIN', (coin) => {
            orderbook.addCoin(coin);
        });
    });

    const orderbook = new Orderbook(io);

    setInterval(() => {
        console.log(io.engine.clientsCount, orderbook.coins);
    }, 60 * 1000);

})();