import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.careon.healthcare',
    appName: 'CareOn',
    webDir: 'out',
    server: {
        androidScheme: 'https',
        iosScheme: 'https'
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
