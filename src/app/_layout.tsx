import { Stack } from "expo-router";
import { useEffect } from "react";
import { OneSignal } from "react-native-onesignal";

const ONESIGNAL_APP_ID = "04108e04-b5ed-476f-8196-f91768166124";
const ADMIN_EXTERNAL_ID = "hikermap-admin";

export default function RootLayout() {
  useEffect(() => {
    OneSignal.initialize(ONESIGNAL_APP_ID);
    OneSignal.login(ADMIN_EXTERNAL_ID);

    OneSignal.Notifications.requestPermission(false);
  }, []);

  return (
    <Stack>
      <Stack.Screen
        name="home"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}