/**
 * 🧪 نظام اختبار شامل لجميع التكاملات 
 * Google Apps Script Test Suite
 */

/**
 * 🎯 الاختبار الرئيسي - شغل هذا أولاً
 */
function runCompleteTest() {
  console.log('🚀 بدء الاختبار الشامل لنظام طلبات الساعات...');
  console.log('=' .repeat(50));
  
  const results = {
    sheets: false,
    email: false,
    telegram: false,
    dataValidation: false,
    integration: false
  };
  
  // 1. اختبار Google Sheets
  console.log('📊 1. اختبار Google Sheets...');
  try {
    const testOrder = createTestOrderData();
    const saveResult = saveToOptimizedSheet(testOrder);
    
    if (saveResult.success) {
      console.log(`✅ Google Sheets يعمل بشكل ممتاز - الصف: ${saveResult.rowNumber}`);
      results.sheets = true;
    } else {
      console.log('❌ خطأ في Google Sheets: ' + saveResult.error);
    }
  } catch (error) {
    console.log('❌ فشل اختبار Google Sheets: ' + error.toString());
  }
  
  // 2. اختبار الإيميل
  console.log('\n📧 2. اختبار الإيميل...');
  try {
    if (CONFIG.EMAIL_ENABLED && CONFIG.NOTIFICATION_EMAIL) {
      sendEmailNotification(createTestOrderData(), 'TEST-ROW');
      console.log('✅ تم إرسال إيميل الاختبار بنجاح');
      console.log(`📩 تحقق من صندوق الوارد: ${CONFIG.NOTIFICATION_EMAIL}`);
      results.email = true;
    } else {
      console.log('⚠️ الإيميل معطل في الإعدادات');
    }
  } catch (error) {
    console.log('❌ فشل اختبار الإيميل: ' + error.toString());
  }
  
  // 3. اختبار Telegram
  console.log('\n📱 3. اختبار Telegram...');
  try {
    if (CONFIG.TELEGRAM_BOT_TOKEN && CONFIG.TELEGRAM_CHAT_ID && CONFIG.TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
      sendTelegramNotification(createTestOrderData(), 'TEST-ROW');
      console.log('✅ تم إرسال رسالة Telegram بنجاح');
      results.telegram = true;
    } else {
      console.log('⚠️ Telegram غير مُعد بالكامل - يحتاج Chat ID');
      console.log('💡 شغل دالة getTelegramChatId() للحصول على Chat ID');
    }
  } catch (error) {
    console.log('❌ فشل اختبار Telegram: ' + error.toString());
  }
  
  // 4. اختبار التحقق من البيانات
  console.log('\n✅ 4. اختبار التحقق من البيانات...');
  try {
    const testData = createTestOrderData();
    const validation = validateCompleteOrderData(testData);
    
    if (validation.isValid) {
      console.log('✅ التحقق من البيانات يعمل بشكل صحيح');
      results.dataValidation = true;
    } else {
      console.log('❌ فشل التحقق: ' + validation.errors.join(', '));
    }
    
    // اختبار بيانات خاطئة
    const invalidData = { fullName: '', phone: '123', wilayaNameAr: '', baladiyaNameAr: '' };
    const invalidValidation = validateCompleteOrderData(invalidData);
    
    if (!invalidValidation.isValid && invalidValidation.errors.length > 0) {
      console.log('✅ التحقق من البيانات الخاطئة يعمل أيضاً');
    }
    
  } catch (error) {
    console.log('❌ فشل اختبار التحقق: ' + error.toString());
  }
  
  // 5. اختبار التكامل الكامل
  console.log('\n� 5. اختبار التكامل الكامل...');
  try {
    // محاكاة طلب POST حقيقي
    const mockEvent = {
      postData: {
        contents: JSON.stringify(createTestOrderData())
      }
    };
    
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    if (response.success) {
      console.log('✅ التكامل الكامل يعمل بشكل ممتاز!');
      console.log(`📝 رسالة النجاح: ${response.message}`);
      results.integration = true;
    } else {
      console.log('❌ فشل التكامل: ' + response.error);
    }
    
  } catch (error) {
    console.log('❌ فشل اختبار التكامل: ' + error.toString());
  }
  
  // النتيجة النهائية
  console.log('\n' + '=' .repeat(50));
  console.log('📋 ملخص نتائج الاختبار:');
  console.log(`📊 Google Sheets: ${results.sheets ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`� الإيميل: ${results.email ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`📱 Telegram: ${results.telegram ? '✅ يعمل' : '⚠️ يحتاج إعداد Chat ID'}`);
  console.log(`✅ التحقق من البيانات: ${results.dataValidation ? '✅ يعمل' : '❌ لا يعمل'}`);
  console.log(`🔗 التكامل الكامل: ${results.integration ? '✅ يعمل' : '❌ لا يعمل'}`);
  
  const workingCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 النتيجة النهائية: ${workingCount}/${totalCount} من الأنظمة تعمل بشكل صحيح`);
  
  if (workingCount === totalCount) {
    console.log('🎉 تهانينا! جميع الأنظمة تعمل بشكل مثالي!');
  } else if (workingCount >= 3) {
    console.log('👍 النظام يعمل بشكل جيد مع بعض الاحتياجات للتحسين');
  } else {
    console.log('⚠️ يوجد مشاكل تحتاج حل قبل النشر');
  }
  
  console.log('\n🔧 الخطوات التالية:');
  if (!results.email) {
    console.log('- تحقق من إعدادات الإيميل في CONFIG');
  }
  if (!results.telegram) {
    console.log('- احصل على Telegram Chat ID باستخدام دالة getTelegramChatId()');
  }
  if (!results.sheets) {
    console.log('- تحقق من صلاحيات Google Sheets');
  }
  
  console.log('\n✅ انتهى الاختبار الشامل!');
}

/**
 * � اختبار سريع للإيميل فقط
 */
function testEmailQuick() {
  console.log('📧 اختبار سريع للإيميل...');
  
  try {
    GmailApp.sendEmail(
      CONFIG.NOTIFICATION_EMAIL,
      '🧪 اختبار سريع - نظام طلبات الساعات',
      `السلام عليكم،

هذه رسالة اختبار من نظام طلبات الساعات.

إذا وصلت هذه الرسالة، فنظام الإيميل يعمل بشكل ممتاز! ✅

الوقت: ${new Date().toLocaleString('ar-DZ', {timeZone: 'Africa/Algiers'})}

مع أطيب التحيات،
نظام طلبات الساعات`,
      {
        name: 'نظام طلبات الساعات - اختبار سريع'
      }
    );
    
    console.log('✅ تم إرسال الإيميل بنجاح!');
    console.log(`📩 تحقق من صندوق الوارد: ${CONFIG.NOTIFICATION_EMAIL}`);
    
  } catch (error) {
    console.log('❌ فشل إرسال الإيميل: ' + error.toString());
    console.log('🔧 تحقق من:');
    console.log('- صحة الإيميل في CONFIG.NOTIFICATION_EMAIL');
    console.log('- صلاحيات Gmail API');
  }
}

/**
 * 📊 اختبار سريع لـ Google Sheets فقط
 */
function testSheetsQuick() {
  console.log('📊 اختبار سريع لـ Google Sheets...');
  
  try {
    const testData = {
      fullName: 'اختبار سريع',
      phone: '0555000000',
      wilayaNameAr: 'الجزائر',
      baladiyaNameAr: 'الجزائر الوسطى',
      selectedWatchId: 'w1',
      deliveryOption: 'home',
      total: '10000',
      notes: 'طلب تجريبي للاختبار السريع'
    };
    
    const result = saveToOptimizedSheet(testData);
    
    if (result.success) {
      console.log(`✅ Google Sheets يعمل بشكل ممتاز!`);
      console.log(`📝 تم حفظ البيانات في الصف: ${result.rowNumber}`);
      console.log(`🔗 رابط الجدول: ${getSpreadsheetUrl()}`);
    } else {
      console.log('❌ خطأ في Google Sheets: ' + result.error);
    }
    
  } catch (error) {
    console.log('❌ فشل اختبار Google Sheets: ' + error.toString());
    console.log('🔧 تحقق من:');
    console.log('- صلاحيات Google Sheets API');
    console.log('- صحة SPREADSHEET_ID في CONFIG');
  }
}

/**
 * 📱 الحصول على Chat ID لـ Telegram
 */
function getTelegramChatId() {
  console.log('🔍 البحث عن Telegram Chat ID...');
  
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    console.log('❌ لا يوجد Bot Token في الإعدادات');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.ok && data.result.length > 0) {
      console.log('📱 Chat IDs الموجودة:');
      console.log('-' .repeat(40));
      
      const uniqueChats = new Map();
      
      data.result.forEach(update => {
        if (update.message && update.message.chat) {
          const chat = update.message.chat;
          uniqueChats.set(chat.id, chat);
        }
      });
      
      let index = 1;
      uniqueChats.forEach((chat, chatId) => {
        console.log(`${index}. Chat ID: ${chatId}`);
        console.log(`   الاسم: ${chat.first_name || 'غير محدد'} ${chat.last_name || ''}`);
        console.log(`   النوع: ${chat.type}`);
        if (chat.username) {
          console.log(`   اسم المستخدم: @${chat.username}`);
        }
        console.log('-' .repeat(40));
        index++;
      });
      
      console.log('\n🔧 لاستخدام Chat ID:');
      console.log('1. انسخ الـ Chat ID المناسب من القائمة أعلاه');
      console.log('2. استبدل YOUR_CHAT_ID_HERE في CONFIG.TELEGRAM_CHAT_ID');
      console.log('3. احفظ السكربت وشغل testTelegramQuick() للتأكد');
      
    } else {
      console.log('⚠️ لا توجد رسائل في البوت. قم بالآتي:');
      console.log('1. ابحث عن البوت في Telegram باستخدام Bot Token');
      console.log('2. أرسل له رسالة /start أو أي رسالة أخرى');
      console.log('3. شغل هذه الدالة مرة أخرى');
      console.log(`\n🔗 رابط البوت: https://t.me/${CONFIG.TELEGRAM_BOT_TOKEN.split(':')[0]}`);
    }
    
  } catch (error) {
    console.log('❌ خطأ في الحصول على Chat ID: ' + error.toString());
    console.log('🔧 تحقق من صحة TELEGRAM_BOT_TOKEN في CONFIG');
  }
}

/**
 * 📱 اختبار سريع لـ Telegram
 */
function testTelegramQuick() {
  console.log('📱 اختبار سريع لـ Telegram...');
  
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    console.log('❌ لا يوجد Bot Token');
    return;
  }
  
  if (!CONFIG.TELEGRAM_CHAT_ID || CONFIG.TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
    console.log('❌ Chat ID غير مُعد. شغل getTelegramChatId() أولاً');
    return;
  }
  
  try {
    const message = `🧪 *اختبار سريع*

السلام عليكم! هذه رسالة اختبار من نظام طلبات الساعات.

✅ إذا وصلت هذه الرسالة، فـ Telegram يعمل بشكل ممتاز!

⏰ الوقت: ${new Date().toLocaleString('ar-DZ', {timeZone: 'Africa/Algiers'})}`;
    
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      console.log('✅ تم إرسال رسالة Telegram بنجاح!');
      console.log('📱 تحقق من تطبيق Telegram');
    } else {
      console.log('❌ فشل إرسال الرسالة: ' + result.description);
    }
    
  } catch (error) {
    console.log('❌ فشل اختبار Telegram: ' + error.toString());
  }
}

/**
 * 🛠️ إنشاء بيانات طلب تجريبية
 */
function createTestOrderData() {
  return {
    fullName: 'أحمد محمد التجريبي',
    phone: '0555123456',
    wilayaNameAr: 'الجزائر',
    baladiyaNameAr: 'بئر مراد رايس',
    selectedWatchId: 'w1',
    deliveryOption: 'home',
    total: '12000',
    notes: 'طلب تجريبي للاختبار الشامل'
  };
}

/**
 * 📋 عرض الإعدادات الحالية
 */
function showCurrentConfig() {
  console.log('📋 الإعدادات الحالية للنظام:');
  console.log('=' .repeat(50));
  
  console.log('📧 إعدادات الإيميل:');
  console.log(`   مُفعل: ${CONFIG.EMAIL_ENABLED ? 'نعم' : 'لا'}`);
  console.log(`   الإيميل: ${CONFIG.NOTIFICATION_EMAIL || 'غير محدد'}`);
  
  console.log('\n📱 إعدادات Telegram:');
  console.log(`   Bot Token: ${CONFIG.TELEGRAM_BOT_TOKEN ? 'موجود' : 'غير موجود'}`);
  console.log(`   Chat ID: ${CONFIG.TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE' ? 'يحتاج إعداد' : CONFIG.TELEGRAM_CHAT_ID}`);
  
  console.log('\n📊 إعدادات Google Sheets:');
  console.log(`   Spreadsheet ID: ${CONFIG.SPREADSHEET_ID || 'سيتم إنشاؤه تلقائياً'}`);
  console.log(`   اسم الجدول: ${CONFIG.SHEET_NAME}`);
  
  console.log('\n⚙️ إعدادات الأداء:');
  console.log(`   السجلات المفصلة: ${CONFIG.ENABLE_DETAILED_LOGS ? 'مُفعلة' : 'معطلة'}`);
  console.log(`   الحد الأقصى للمعالجة: ${CONFIG.MAX_PROCESSING_TIME}ms`);
  
  console.log('\n🔗 روابط مفيدة:');
  if (CONFIG.SPREADSHEET_ID) {
    console.log(`   الجدول: https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}`);
  }
  if (CONFIG.TELEGRAM_BOT_TOKEN) {
    console.log(`   البوت: https://t.me/${CONFIG.TELEGRAM_BOT_TOKEN.split(':')[0]}`);
  }
}
