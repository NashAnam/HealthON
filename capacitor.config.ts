import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.healthon.app',
    appName: 'HealthOn',
    webDir: 'out',
    server: {
        url: 'https://www.healthon.app',
        androidScheme: 'https',
        iosScheme: 'https',
        cleartext: true
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            backgroundColor: '#4F46E5',
            showSpinner: false
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert']
        }
    }
};

export default config;
