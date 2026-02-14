"use client";
import { useEffect } from 'react';

export default function NotificationHandler() {
  useEffect(() => {
    // التأكد من أن الكود يعمل فقط في المتصفح
    if (typeof window !== "undefined") {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: "65a1e9a0-6ceb-4f86-9bcc-e1f0b435e610",
          allowLocalhostAsSecureOrigin: true, // مهم جداً لتجربة الموقع على localhost
          notifyButton: {
            enable: true, // يظهر الجرس الأحمر الصغير للاشتراك
            position: 'bottom-right', // موقع الجرس
            size: 'medium',
            theme: 'default',
            displayPredicate: () => {
              return OneSignal.getNotificationPermission().then(permission => {
                return permission !== 'granted'; // يختفي الجرس تلقائياً بعد الاشتراك
              });
            },
            text: {
              'tip.state.unsubscribed': 'اشتراك في تنبيهات WIND',
              'tip.state.subscribed': 'أنت مشترك بالفعل',
              'tip.state.blocked': 'لقد حظرت التنبيهات',
              'message.action.subscribed': 'شكراً للاشتراك!',
              'message.action.resubscribed': 'أهلاً بك مجدداً في WIND',
              'dialog.main.title': 'إدارة تنبيهات WIND',
              'dialog.main.button.subscribe': 'اشتراك الآن',
              'dialog.main.button.unsubscribe': 'إلغاء الاشتراك'
            }
          },
          welcomeNotification: {
            title: "WIND Store",
            message: "أهلاً بك! ستصلك تنبيهات المبيعات هنا بصوت الكاشير 💰",
          }
        });

        console.log("OneSignal initialized for WIND");
      });
    }
  }, []);

  return null;
}