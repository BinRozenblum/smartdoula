import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// *** חשוב: החלף ב-ID האמיתי של הפרויקט החדש מ-Expo ***
const EXPO_PROJECT_ID = "1afdcd01-0d15-4a0a-b17b-40334536974e";

// כתובת האתר של הדולה (Production URL)
const WEBSITE_URL = "https://smart-doula.netlify.app/"; // או הכתובת האמיתית שלך

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const webViewRef = useRef<WebView>(null);
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

  // 2. כפתור חזרה באנדרואיד
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

  // 3. שליחת הטוקן לאתר (הזרקה אגרסיבית)
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
            window.postMessage(${message}, "*");
            // שמירה גם בלוקל סטורג' ליתר ביטחון
            localStorage.setItem("expo_push_token", "${expoPushToken}");
          } catch(e) { console.error(e); }
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(jsCode);
      // שיטת גיבוי
      webViewRef.current.postMessage(message);
    }
  };

  // נסה לשלוח כשהטוקן מוכן או כשהאתר נטען
  useEffect(() => {
    if (expoPushToken && isWebViewLoaded) {
      sendTokenToWeb();
      // ניסיון חוזר כל 5 שניות למקרה שהאתר עשה רענון או ניווט
      const interval = setInterval(sendTokenToWeb, 5000);
      return () => clearInterval(interval);
    }
  }, [expoPushToken, isWebViewLoaded]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: WEBSITE_URL }}
          onNavigationStateChange={(navState) =>
            setCanGoBack(navState.canGoBack)
          }
          onLoadEnd={() => {
            setIsWebViewLoaded(true);
            setTimeout(sendTokenToWeb, 1500); // המתנה קצרה שהריאקט יטען
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsBackForwardNavigationGestures={true}
          style={styles.webview}
          // אפשר להוסיף UserAgent כדי שהאתר ידע שהוא באפליקציה
          userAgent="SmartDoulaApp/1.0.0"
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ... פונקציית registerForPushNotificationsAsync (העתק אותה כמו שהיא מ-CityPulse)
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
      // כאן חשוב לשים את ה-ID החדש
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (e) {
      console.log("Error fetching token:", e);
    }
  } else {
    // alert('Must use physical device for Push Notifications');
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // התאם לצבעי Smart Doula (למשל #fff1f2 לפי ה-theme)
  },
  webview: {
    flex: 1,
  },
});
