// prisma.config.ts
import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

// 환경 변수 로드 강제 실행
dotenv.config();

console.log("--- Prisma Config Debug ---");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("---------------------------");

export default defineConfig({
    datasource: {
        // Prisma 7에서는 CLI용 직접 연결(DIRECT_URL)만 config 파일에 지정하고,
        // 클라이언트 런타임에는 DATABASE_URL을 동적으로 주입하는 방식을 권장합니다.
        // 만약 여기서 undefined가 뜨면 파일 인식이 안 된 것입니다.
        url: process.env.DIRECT_URL,
    },
});