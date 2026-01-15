import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// *** חשוב: החלף ב-ID האמיתי של הפרויקט החדש מ-Expo ***
const EXPO_PROJECT_ID = "1afdcd01-0d15-4a0a-b17b-40334536974e";

// כתובת הבסיס של האתר (ללא סלאש בסוף עדיף, כדי למנוע כפילויות)
const WEBSITE_BASE_URL = "https://smart-doula.netlify.app";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const webViewRef = useRef<WebView>(null);

  // ניהול ה-URL ב-State כדי שנוכל לשנות אותו בלחיצה על התראה
  const [currentUrl, setCurrentUrl] = useState(WEBSITE_BASE_URL);

  const [expoPushToken, setExpoPushToken] = useState("");
  const [isWebViewLoaded, setIsWebViewLoaded] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // 1. יצירת הטוקן
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        console.log("Token Generated:", token);
      }
    });
  }, []);

  // 2. טיפול בלחיצה על התראות (Deep Linking)
  useEffect(() => {
    // א. טיפול בלחיצה כשהאפליקציה רצה ברקע או פתוחה
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    );

    // ב. טיפול בלחיצה כשהאפליקציה הייתה סגורה לגמרי (Cold Start)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data;
        handleNotificationNavigation(data);
      }
    });

    return () => subscription.remove();
  }, []);

  // פונקציית עזר לניווט
  const handleNotificationNavigation = (data: any) => {
    // וידוא שזו ההתראה הנכונה ושיש לנו ID
    if (data?.type === "CONTRACTION_ALERT" && data?.pregnancyId) {
      const targetUrl = `${WEBSITE_BASE_URL}/doula/live-monitor/${data.pregnancyId}`;
      console.log("🔔 Notification clicked! Navigating to:", targetUrl);

      // שינוי ה-URL יגרום ל-WebView להיטען מחדש בעמוד הרצוי
      setCurrentUrl(targetUrl);
    }
  };

  // 3. כפתור חזרה באנדרואיד
  useEffect(() => {
    const onBackPress = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  // 4. שליחת הטוקן לאתר (Sticky Mode)
  const sendTokenToWeb = () => {
    if (expoPushToken && webViewRef.current) {
      const message = JSON.stringify({
        type: "EXPO_PUSH_TOKEN",
        token: expoPushToken,
      });

      console.log("Sending token to web...");

      const jsCode = `
        (function() {
          try {
            window.localStorage.setItem('expo_push_token_buffer', '${expoPushToken}');
            window.postMessage(${message}, "*");
          } catch(e) { console.error(e); }
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(jsCode);
    }
  };

  // שליחה כשהטוקן מוכן או כשהאתר נטען מחדש (חשוב במיוחד אחרי ניווט מהתראה)
  useEffect(() => {
    if (expoPushToken && isWebViewLoaded) {
      sendTokenToWeb();
      // טיימר גיבוי
      const interval = setInterval(sendTokenToWeb, 5000);
      return () => clearInterval(interval);
    }
  }, [expoPushToken, isWebViewLoaded]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }} // שימוש ב-state המשתנה
          onNavigationStateChange={(navState) =>
            setCanGoBack(navState.canGoBack)
          }
          onLoadEnd={() => {
            setIsWebViewLoaded(true);
            // שליחת טוקן גם אחרי ניווט מהתראה
            setTimeout(sendTokenToWeb, 1500);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          style={styles.webview}
          userAgent="SmartDoulaApp/1.0.0"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ... פונקציית registerForPushNotificationsAsync (ללא שינוי)
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("נדרשת הרשאה להתראות כדי לקבל עדכונים!");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (e) {
      console.log("Error fetching token:", e);
    }
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
});
