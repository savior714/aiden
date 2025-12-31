import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.juwon.aiden',
    appName: 'AIDEN',
    webDir: 'out',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        App: {
            // 뒤로가기 버튼 핸들링을 위한 설정
        }
    }
};

export default config;
