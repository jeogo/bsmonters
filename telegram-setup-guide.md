# 🤖 دليل إعداد Telegram للإشعارات التلقائية

## 📱 الخطوات السريعة للحصول على Chat ID

### 🔸 الطريقة الأولى: باستخدام السكربت (الأسهل)

#### 1. تأكد من Bot Token
في ملف `google-apps-script-optimized.js`:
```javascript
TELEGRAM_BOT_TOKEN: '7997859092:AAEXd7uXbf9D1bYSxoSZkoY0zZmUyjFUt5g', // ✅ موجود
```

#### 2. ابدأ محادثة مع البوت
1. افتح Telegram على هاتفك أو الكمبيوتر
2. ابحث عن البوت باستخدام Token الخاص بك
3. أرسل `/start` للبوت
4. أرسل أي رسالة أخرى (مثل "مرحبا")

#### 3. شغّل دالة الحصول على Chat ID
1. في Google Apps Script Editor
2. اختر الدالة `getTelegramChatId` من القائمة المنسدلة
3. انقر "تشغيل" ▶️
4. ستظهر Chat ID في السجلات (Logs)
5. **انسخ Chat ID** وضعه في الكود:

```javascript
TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID_HERE', // استبدل هذا بالرقم الذي حصلت عليه
```

---

### 🔸 الطريقة الثانية: يدوياً (احتياطية)

#### 1. استخدام متصفح الويب
اذهب إلى هذا الرابط (استبدل BOT_TOKEN بالتوكن الخاص بك):
```
https://api.telegram.org/bot7997859092:AAEXd7uXbf9D1bYSxoSZkoY0zZmUyjFUt5g/getUpdates
```

#### 2. ابحث عن Chat ID
ستجد شيئاً مثل هذا:
```json
{
  "ok": true,
  "result": [
    {
      "message": {
        "chat": {
          "id": 123456789,  // ← هذا هو Chat ID
          "first_name": "اسمك",
          "type": "private"
        }
      }
    }
  ]
}
```

---

### 🔸 الطريقة الثالثة: استخدام @userinfobot

1. ابحث عن `@userinfobot` في Telegram
2. ابدأ محادثة معه
3. سيرسل لك Chat ID مباشرة

---

## 🧪 اختبار النظام

### بعد إضافة Chat ID:
```javascript
const CONFIG = {
  TELEGRAM_BOT_TOKEN: '7997859092:AAEXd7uXbf9D1bYSxoSZkoY0zZmUyjFUt5g',
  TELEGRAM_CHAT_ID: '123456789', // ضع Chat ID هنا
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: 'kalijeogo@gmail.com'
};
```

### شغّل دالة الاختبار:
1. في Google Apps Script Editor
2. اختر `testScript` من القائمة
3. انقر "تشغيل" ▶️
4. يجب أن تصلك رسالة اختبار على Telegram والإيميل

---

## ❓ حل المشاكل الشائعة

### إذا لم تصل رسائل Telegram:
- ✅ تأكد من صحة Bot Token
- ✅ تأكد من صحة Chat ID (أرقام فقط، بدون مسافات)
- ✅ تأكد من بدء محادثة مع البوت أولاً
- ✅ تحقق من السجلات (Logs) في Google Apps Script

### إذا ظهر خطأ "Forbidden":
- البوت لم يتم بدء محادثة معه بعد
- أرسل `/start` للبوت ثم حاول مرة أخرى

### إذا ظهر خطأ "Chat not found":
- Chat ID خاطئ
- استخدم الطرق أعلاه للحصول على Chat ID الصحيح

---

## 📋 ملخص سريع

1. **أرسل `/start` للبوت** في Telegram
2. **شغّل `getTelegramChatId()`** في Google Apps Script
3. **انسخ Chat ID** من السجلات
4. **ضعه في الكود** مكان `'YOUR_CHAT_ID_HERE'`
5. **شغّل `testScript()`** للاختبار
6. **ستصلك رسالة تأكيد** على Telegram والإيميل

🎉 **بعدها كل طلب جديد سيصلك إشعار فوري!**
