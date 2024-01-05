import {Bot} from "./bot.js";
import {Env} from "./env.js";

(async () => {
    const connectKey: string = Env.GetEnv('CONNECT_KEY', '') as string;
    const secretKey: string = Env.GetEnv('SECRET_KEY', '') as string;

    if (!connectKey || !secretKey) throw new Error('CONNECT_KEY or SECRET_KEY is empty');

    console.log('상태값 설명 [24시간 거래량(억원 단위)/앱 시작후 거래량(만원 단위)/초당 거래량(만원 단위)(><)24시간 기준 평균 초당 거래량(만원 단위)]');
    const bot = new Bot(connectKey, secretKey);
    await bot.start();
})();