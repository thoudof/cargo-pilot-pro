
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b2c12389c82a4904ba179dc3d23acb7e',
  appName: 'A Lovable project',
  webDir: 'dist',
  server: {
    url: 'https://b2c12389-c82a-4904-ba17-9dc3d23acb7e.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
  },
};

export default config;
