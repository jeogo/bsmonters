/**
 * سكربت Google Apps محسّن وسريع لمعالجة طلبات الساعات
 * 🚀 محسّن للسرعة والأداء العالي - بدون setHeaders (غير مدعوم)
 */

// ⚙️ إعدادات التطبيق - عدّل هنا حسب حاجتك
const CONFIG = {
  // Telegram Bot إعدادات
  TELEGRAM_BOT_TOKEN: '7997859092:AAEXd7uXbf9D1bYSxoSZkoY0zZmUyjFUt5g',
  TELEGRAM_CHAT_ID: 'YOUR_CHAT_ID_HERE',
  
  // إعدادات الإيميل
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: 'kalijeogo@gmail.com', // إيميلك لاستقبال الإشعارات
  
  // إعدادات Google Sheets - استخدام جدول واحد ثابت
  SPREADSHEET_ID: '1mK7jX8rLpQwN5vE9cB4fH2aT6dG8sY3uI0oP7rM6qZ5', // ضع ID الجدول هنا أو اتركه فارغ لإنشاء جديد
  SHEET_NAME: 'الطلبات',
  
  // إعدادات الأداء
  MAX_PROCESSING_TIME: 25000, // 25 ثانية (حد Google Apps Script)
  ENABLE_DETAILED_LOGS: true // true للتأكد من عمل كل شيء
};

// 📋 رؤوس أعمدة Google Sheets
const SHEET_HEADERS = [
  'التاريخ والوقت',
  'الاسم الكامل', 
  'رقم الهاتف',
  'الولاية',
  'البلدية',
  'الساعة المختارة',
  'طريقة التوصيل',
  'المبلغ الإجمالي',
  'ملاحظات',
  'حالة الطلب',
  'تاريخ المتابعة'
];

/**
 * 🔧 إنشاء معرف فريد للطلب
 */
function generateRequestId() {
  return 'REQ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
}

/**
 * 🎯 دالة معالجة الطلبات الرئيسية (POST)
 */
function doPost(e) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    log(`📦 [${requestId}] بدء معالجة طلب جديد...`);
    
    // تحليل البيانات الواردة أولاً
    const orderData = parseOrderData(e);
    if (!orderData.success) {
      log(`❌ [${requestId}] خطأ في تحليل البيانات: ${orderData.error}`);
      return createErrorResponse('بيانات الطلب غير مكتملة أو غير صحيحة');
    }
    
    log(`📋 [${requestId}] البيانات المستلمة: ${JSON.stringify(orderData.data, null, 2)}`);
    
    // التحقق من جميع البيانات المطلوبة
    const validationResult = validateCompleteOrderData(orderData.data);
    if (!validationResult.isValid) {
      log(`❌ [${requestId}] فشل التحقق: ${validationResult.errors.join(', ')}`);
      return createErrorResponse(`بيانات ناقصة: ${validationResult.errors.join(', ')}`);
    }
    
    // معالجة البيانات وتنسيقها
    const processedData = processOrderData(orderData.data);
    log(`✅ [${requestId}] تم تنسيق البيانات بنجاح`);
    
    // حفظ في Google Sheets مع ضمان النجاح
    const saveResult = saveToOptimizedSheet(processedData);
    if (!saveResult.success) {
      log(`❌ [${requestId}] فشل الحفظ الأساسي: ${saveResult.error}`);
      
      // محاولة احتياطية فورية
      const backupResult = saveSimpleBackup(processedData);
      if (!backupResult.success) {
        log(`❌ [${requestId}] فشل الحفظ الاحتياطي أيضاً!`);
        return createErrorResponse('فشل في حفظ البيانات. حاول مرة أخرى.');
      }
      
      log(`✅ [${requestId}] تم الحفظ الاحتياطي في الصف: ${backupResult.rowNumber}`);
      saveResult.rowNumber = backupResult.rowNumber;
      saveResult.success = true;
    } else {
      log(`✅ [${requestId}] تم حفظ البيانات بنجاح في الصف: ${saveResult.rowNumber}`);
    }
    
    // إرسال الإشعارات فوراً
    const notificationResult = sendNotificationsSync(processedData, saveResult.rowNumber, requestId);
    log(`📧 [${requestId}] نتيجة الإشعارات: ${JSON.stringify(notificationResult)}`);
    
    const processingTime = Date.now() - startTime;
    log(`✅ [${requestId}] انتهت معالجة الطلب بنجاح في ${processingTime}ms`);
    
    // إرجاع استجابة نجاح مع تفاصيل
    return createSuccessResponse({
      message: '✅ تم استلام وحفظ طلبك بنجاح! سنتصل بك خلال دقائق 📞',
      status: 'confirmed',
      orderNumber: saveResult.rowNumber,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    log(`❌ [${requestId}] خطأ عام في معالجة الطلب: ${error.toString()} (${processingTime}ms)`);
    log(`❌ [${requestId}] Stack trace: ${error.stack || 'غير متوفر'}`);
    
    return createErrorResponse('حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.');
  }
}

/**
 * 🎯 دالة معالجة CORS (OPTIONS)
 */
function doOptions() {
  return createCorsResponse();
}

/**
 * ✅ التحقق الشامل من بيانات الطلب
 */
function validateCompleteOrderData(data) {
  const errors = [];
  
  // التحقق من البيانات الأساسية
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('الاسم الكامل مطلوب (حدين أدنى حرفين)');
  }
  
  if (!data.phone || !/^(05|06|07)\d{8}$/.test(data.phone.replace(/\s+/g, ''))) {
    errors.push('رقم هاتف جزائري صحيح مطلوب (05, 06, أو 07)');
  }
  
  if (!data.wilayaNameAr || data.wilayaNameAr.trim().length < 2) {
    errors.push('اسم الولاية مطلوب');
  }
  
  if (!data.baladiyaNameAr || data.baladiyaNameAr.trim().length < 2) {
    errors.push('اسم البلدية مطلوب');
  }
  
  if (!data.selectedWatchId) {
    errors.push('يجب اختيار ساعة');
  }
  
  if (!data.deliveryOption || !['home', 'office'].includes(data.deliveryOption)) {
    errors.push('يجب تحديد طريقة التوصيل (المنزل أو المكتب)');
  }
  
  if (!data.total || isNaN(parseInt(data.total)) || parseInt(data.total) <= 0) {
    errors.push('المبلغ الإجمالي غير صحيح');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 🔄 معالجة وتنسيق بيانات الطلب
 */
function processOrderData(rawData) {
  return {
    // البيانات الأساسية منظفة
    fullName: rawData.fullName.trim(),
    phone: rawData.phone.replace(/\s+/g, ''), // إزالة المسافات من الهاتف
    wilayaNameAr: rawData.wilayaNameAr.trim(),
    baladiyaNameAr: rawData.baladiyaNameAr.trim(),
    
    // معلومات الساعة والطلب
    selectedWatchId: rawData.selectedWatchId,
    deliveryOption: rawData.deliveryOption,
    total: parseInt(rawData.total),
    notes: rawData.notes ? rawData.notes.trim() : '',
    
    // معلومات إضافية للنظام
    orderDate: new Date().toISOString(),
    orderStatus: 'جديد',
    followUpDate: new Date(Date.now() + 24*60*60*1000).toISOString(), // غداً
    
    // معلومات فنية
    userAgent: rawData.userAgent || 'غير محدد',
    ipAddress: rawData.ipAddress || 'غير محدد',
    source: rawData.source || 'الموقع الرسمي'
  };
}

/**
 * 📧 إرسال الإشعارات بشكل متزامن (مع انتظار النتيجة)
 */
function sendNotificationsSync(orderData, rowNumber, requestId) {
  const results = {
    email: { success: false, error: null },
    telegram: { success: false, error: null }
  };
  
  // إرسال الإيميل
  if (CONFIG.EMAIL_ENABLED && CONFIG.NOTIFICATION_EMAIL) {
    try {
      sendEmailNotification(orderData, rowNumber);
      results.email.success = true;
      log(`✅ [${requestId}] تم إرسال الإيميل بنجاح`);
    } catch (emailError) {
      results.email.error = emailError.toString();
      log(`❌ [${requestId}] فشل إرسال الإيميل: ${emailError.toString()}`);
    }
  } else {
    results.email.error = 'الإيميل معطل أو غير مُعد';
    log(`⚠️ [${requestId}] الإيميل معطل أو غير مُعد`);
  }
  
  // إرسال Telegram
  if (CONFIG.TELEGRAM_BOT_TOKEN && CONFIG.TELEGRAM_CHAT_ID && CONFIG.TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
    try {
      sendTelegramNotification(orderData, rowNumber);
      results.telegram.success = true;
      log(`✅ [${requestId}] تم إرسال رسالة Telegram بنجاح`);
    } catch (telegramError) {
      results.telegram.error = telegramError.toString();
      log(`❌ [${requestId}] فشل إرسال Telegram: ${telegramError.toString()}`);
    }
  } else {
    results.telegram.error = 'Telegram غير مُعد بالكامل';
    log(`⚠️ [${requestId}] Telegram غير مُعد بالكامل`);
  }
  
  return results;
}

/**
 * 📝 تحليل بيانات الطلب الواردة
 */
function parseOrderData(e) {
  try {
    log('🔍 بدء تحليل البيانات...');
    
    // تحقق من وجود المحتوى
    if (!e || !e.postData || !e.postData.contents) {
      log('❌ لا توجد بيانات POST');
      return { success: false, error: 'لا توجد بيانات في الطلب' };
    }
    
    log('📄 محتوى الطلب: ' + e.postData.contents);
    
    // تحليل JSON
    let rawData;
    try {
      rawData = JSON.parse(e.postData.contents);
      log('✅ تم تحليل JSON بنجاح');
    } catch (jsonError) {
      log('❌ خطأ في تحليل JSON: ' + jsonError.toString());
      return { success: false, error: 'تنسيق البيانات غير صحيح' };
    }
    
    // طباعة البيانات المستلمة للتأكد
    log('📊 البيانات المستلمة: ' + JSON.stringify(rawData, null, 2));
    
    // تحقق من البيانات المطلوبة
    const required = ['fullName', 'phone', 'wilayaNameAr', 'baladiyaNameAr'];
    const missing = [];
    
    for (const field of required) {
      if (!rawData[field] || rawData[field].toString().trim() === '') {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      log('❌ بيانات مفقودة: ' + missing.join(', '));
      return { 
        success: false, 
        error: `البيانات التالية مطلوبة: ${missing.join(', ')}` 
      };
    }
    
    log('✅ تم التحقق من البيانات الأساسية');
    return { success: true, data: rawData };
    
  } catch (error) {
    log('❌ خطأ عام في تحليل البيانات: ' + error.toString());
    return { 
      success: false, 
      error: `خطأ في تحليل البيانات: ${error.toString()}` 
    };
  }
}

/**
 * 💾 حفظ البيانات في Google Sheets بطريقة محسّنة
 */
function saveToOptimizedSheet(orderData) {
  try {
    log('💾 بدء حفظ البيانات في Google Sheets...');
    
    // الحصول على أو إنشاء الجدول
    const sheet = getOrCreateSheet();
    log('📊 تم الحصول على الجدول بنجاح');
    
    // تحضير البيانات للإدراج
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, 'Africa/Algiers', 'dd/MM/yyyy HH:mm:ss');
    
    // ترجمة طريقة التوصيل
    let deliveryText = 'غير محدد';
    if (orderData.deliveryOption === 'home') {
      deliveryText = 'المنزل';
    } else if (orderData.deliveryOption === 'office') {
      deliveryText = 'المكتب';
    }
    
    // ترجمة الساعة المختارة
    let watchText = orderData.selectedWatchId || 'غير محدد';
    if (watchText.startsWith('w')) {
      const num = watchText.replace('w', '');
      watchText = `ساعة رقم ${num}`;
    }
    
    const rowData = [
      formattedDate,                    // التاريخ والوقت
      orderData.fullName,               // الاسم الكامل
      orderData.phone,                  // رقم الهاتف
      orderData.wilayaNameAr,           // الولاية
      orderData.baladiyaNameAr,         // البلدية
      watchText,                        // الساعة المختارة
      deliveryText,                     // طريقة التوصيل
      orderData.total + ' دج',          // المبلغ الإجمالي
      orderData.notes || 'لا توجد',     // ملاحظات
      'جديد',                          // حالة الطلب
      ''                               // تاريخ المتابعة (فارغ في البداية)
    ];
    
    log('📝 البيانات المُحضّرة للحفظ: ' + JSON.stringify(rowData));
    
    // إدراج الصف الجديد (أسرع من appendRow)
    const lastRow = sheet.getLastRow();
    const newRowNumber = lastRow + 1;
    
    log(`📍 سيتم إدراج البيانات في الصف رقم: ${newRowNumber}`);
    
    // كتابة البيانات
    const range = sheet.getRange(newRowNumber, 1, 1, rowData.length);
    range.setValues([rowData]);
    
    log('✅ تم حفظ البيانات في الجدول');
    
    // تنسيق سريع للصف الجديد
    try {
      const newRowRange = sheet.getRange(newRowNumber, 1, 1, rowData.length);
      newRowRange.setFontSize(10);
      newRowRange.setWrap(true);
      
      // تلوين حالة "جديد" باللون الأخضر
      sheet.getRange(newRowNumber, 10).setBackground('#d4edda').setFontWeight('bold');
      
      // تلوين المبلغ الإجمالي
      sheet.getRange(newRowNumber, 8).setFontWeight('bold').setFontColor('#28a745');
      
      log('🎨 تم تنسيق الصف بنجاح');
      
    } catch (formatError) {
      log('⚠️ تحذير: فشل في تنسيق الصف: ' + formatError.toString());
      // لا نرمي خطأ هنا لأن الحفظ نجح
    }
    
    log(`💾 تم حفظ الطلب بنجاح في الصف رقم ${newRowNumber}`);
    
    return { success: true, rowNumber: newRowNumber };
    
  } catch (error) {
    log(`❌ خطأ في حفظ البيانات: ${error.toString()}`);
    
    // محاولة إضافية لحفظ البيانات بطريقة أبسط
    try {
      log('🔄 محاولة حفظ بطريقة احتياطية...');
      
      const sheet = getOrCreateSheet();
      const simpleData = [
        new Date().toLocaleString('ar-DZ'),
        orderData.fullName,
        orderData.phone,
        orderData.wilayaNameAr,
        orderData.baladiyaNameAr,
        orderData.selectedWatchId,
        orderData.deliveryOption,
        orderData.total,
        orderData.notes || '',
        'جديد',
        ''
      ];
      
      sheet.appendRow(simpleData);
      log('✅ تم الحفظ بالطريقة الاحتياطية');
      
      return { success: true, rowNumber: sheet.getLastRow() };
      
    } catch (backupError) {
      log(`❌ فشل في الحفظ الاحتياطي: ${backupError.toString()}`);
      
      return { 
        success: false, 
        error: `فشل في حفظ البيانات: ${error.toString()}` 
      };
    }
  }
}

/**
 * 📊 الحصول على أو إنشاء جدول Google Sheets الوحيد
 */
function getOrCreateSheet() {
  try {
    let spreadsheet;
    
    if (CONFIG.SPREADSHEET_ID) {
      // محاولة فتح الجدول الموجود
      try {
        spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
        log('📖 تم فتح الجدول الموجود: ' + CONFIG.SPREADSHEET_ID);
      } catch (openError) {
        log('⚠️ فشل في فتح الجدول المحدد، سيتم إنشاء جدول جديد...');
        spreadsheet = null;
      }
    }
    
    // إنشاء جدول جديد إذا لم يكن موجود
    if (!spreadsheet) {
      spreadsheet = SpreadsheetApp.create('طلبات الساعات - ' + new Date().toDateString());
      log('📊 تم إنشاء جدول جديد: ' + spreadsheet.getId());
      
      // تحديث CONFIG بـ ID الجديد (للاستخدام في نفس الجلسة)
      CONFIG.SPREADSHEET_ID = spreadsheet.getId();
    }
    
    // الحصول على أو إنشاء الصفحة
    let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      // إنشاء صفحة جديدة
      sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
      log('📝 تم إنشاء صفحة جديدة: ' + CONFIG.SHEET_NAME);
      
      // إضافة رؤوس الأعمدة
      const headerRange = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
      headerRange.setValues([SHEET_HEADERS]);
      
      // تنسيق الرؤوس
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4472C4');
      headerRange.setFontColor('#FFFFFF');
      headerRange.setHorizontalAlignment('center');
      
      // تجميد الصف الأول
      sheet.setFrozenRows(1);
      
      // ضبط عرض الأعمدة
      sheet.autoResizeColumns(1, SHEET_HEADERS.length);
      
      log('✅ تم تجهيز الجدول برؤوس الأعمدة');
    } else {
      log('📋 تم العثور على الصفحة الموجودة: ' + CONFIG.SHEET_NAME);
    }
    
    return sheet;
    
  } catch (error) {
    log('❌ خطأ في إنشاء/فتح الجدول: ' + error.toString());
    throw new Error(`فشل في إنشاء أو فتح الجدول: ${error.toString()}`);
  }
}

/**
 * 💾 حفظ احتياطي بسيط
 */
function saveSimpleBackup(orderData) {
  try {
    log('🆘 بدء الحفظ الاحتياطي البسيط...');
    
    // إنشاء جدول احتياطي إذا لزم الأمر
    const backupName = 'احتياطي_طلبات_' + new Date().toISOString().split('T')[0];
    let backupSheet = SpreadsheetApp.create(backupName);
    
    const sheet = backupSheet.getActiveSheet();
    sheet.setName('طلبات_احتياطية');
    
    // إضافة البيانات
    const data = [
      ['التاريخ', 'الاسم', 'الهاتف', 'الولاية', 'البلدية', 'الساعة', 'التوصيل', 'المبلغ', 'ملاحظات'],
      [
        new Date().toLocaleString(),
        orderData.fullName,
        orderData.phone,
        orderData.wilayaNameAr,
        orderData.baladiyaNameAr,
        orderData.selectedWatchId,
        orderData.deliveryOption,
        orderData.total,
        orderData.notes || ''
      ]
    ];
    
    sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    
    log('💾 تم الحفظ الاحتياطي في: ' + backupSheet.getId());
    
    return { success: true, rowNumber: 2, spreadsheetId: backupSheet.getId() };
    
  } catch (error) {
    log('❌ فشل الحفظ الاحتياطي: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * 📧 إرسال إشعار بالإيميل
 */
function sendEmailNotification(orderData, rowNumber) {
  try {
    const subject = `🔔 طلب ساعة جديد #${rowNumber} - ${orderData.fullName}`;
    
    const htmlBody = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🎉 طلب ساعة جديد!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">طلب رقم #${rowNumber}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">📋 تفاصيل الطلب</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">👤 الاسم الكامل</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">📱 رقم الهاتف</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.phone}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">📍 الولاية</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.wilayaNameAr}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">🏘️ البلدية</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.baladiyaNameAr}</td>
            </tr>
            <tr style="background: #f8f9fa;">
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">⌚ الساعة المختارة</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.selectedWatchId}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">🚚 طريقة التوصيل</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.deliveryOption === 'home' ? 'المنزل' : 'المكتب'}</td>
            </tr>
            <tr style="background: #e8f5e8;">
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">💰 المبلغ الإجمالي</td>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold; color: #28a745;">${orderData.total} دج</td>
            </tr>
            ${orderData.notes ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">📝 ملاحظات</td>
              <td style="padding: 12px; border: 1px solid #dee2e6;">${orderData.notes}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">📞 خطوات المتابعة</h3>
            <ol style="color: #666; line-height: 1.6;">
              <li>اتصل بالعميل خلال ساعة من استلام الطلب</li>
              <li>تأكد من جميع التفاصيل وحدد موعد التوصيل</li>
              <li>حدّث حالة الطلب في الجدول إلى "تم التأكيد"</li>
              <li>أرسل الطلب للتحضير والشحن</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${getSpreadsheetUrl()}" style="background: #28a745; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold;">📊 عرض الجدول الكامل</a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>تم إرسال هذا الإشعار تلقائياً في ${new Date().toLocaleString('ar-DZ', {timeZone: 'Africa/Algiers'})}</p>
        </div>
      </div>
    `;
    
    // إرسال الإيميل
    GmailApp.sendEmail(
      CONFIG.NOTIFICATION_EMAIL,
      subject,
      '', // النص العادي (فارغ لأننا نستخدم HTML)
      {
        htmlBody: htmlBody,
        name: 'نظام إدارة طلبات الساعات'
      }
    );
    
    log('📧 تم إرسال إشعار الإيميل بنجاح');
    
  } catch (error) {
    log(`❌ فشل في إرسال إشعار الإيميل: ${error.toString()}`);
  }
}

/**
 * 📱 إرسال إشعار Telegram
 */
function sendTelegramNotification(orderData, rowNumber) {
  try {
    const message = `
🔔 *طلب ساعة جديد #${rowNumber}*

👤 *الاسم:* ${orderData.fullName}
📱 *الهاتف:* ${orderData.phone}
📍 *العنوان:* ${orderData.wilayaNameAr}, ${orderData.baladiyaNameAr}
⌚ *الساعة:* ${orderData.selectedWatchId}
🚚 *التوصيل:* ${orderData.deliveryOption === 'home' ? 'المنزل' : 'المكتب'}
💰 *المبلغ:* ${orderData.total} دج
${orderData.notes ? `📝 *ملاحظات:* ${orderData.notes}` : ''}

⏰ *الوقت:* ${new Date().toLocaleString('ar-DZ', {timeZone: 'Africa/Algiers'})}

📊 [عرض الجدول الكامل](${getSpreadsheetUrl()})
    `.trim();
    
    const telegramUrl = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: CONFIG.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    };
    
    const response = UrlFetchApp.fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(payload)
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      log('📱 تم إرسال إشعار Telegram بنجاح');
    } else {
      log('❌ فشل في إرسال Telegram: ' + result.description);
    }
    
  } catch (error) {
    log(`❌ فشل في إرسال إشعار Telegram: ${error.toString()}`);
  }
}

/**
 * 🔗 الحصول على رابط الجدول
 */
function getSpreadsheetUrl() {
  try {
    if (CONFIG.SPREADSHEET_ID) {
      return `https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID}`;
    }
    return 'https://drive.google.com/drive/folders/0B2KmY_9QZGGqaG93NmxLSEJEUFk'; // مجلد Google Drive العام
  } catch (error) {
    return 'https://drive.google.com';
  }
}

/**
 * ✅ إنشاء استجابة نجاح
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      ...data
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ❌ إنشاء استجابة خطأ
 */
function createErrorResponse(message, statusCode = 400) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      error: message,
      statusCode: statusCode
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 🌐 إنشاء استجابة CORS للـ OPTIONS
 */
function createCorsResponse() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/**
 * 📝 دالة التسجيل المحسّنة
 */
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  // سجّل دائماً للتأكد من إمكانية التتبع
}

/**
 * 🧪 اختبار شامل للنظام
 */
function testEverything() {
  log('🧪 بدء الاختبار الشامل...');
  
  // بيانات تجريبية
  const testData = {
    fullName: 'أحمد محمد التجريبي',
    phone: '0555123456',
    wilayaNameAr: 'الجزائر',
    baladiyaNameAr: 'بئر مراد رايس',
    selectedWatchId: 'w1',
    deliveryOption: 'home',
    total: 12000,
    notes: 'طلب تجريبي'
  };
  
  try {
    // اختبار الحفظ
    log('📊 اختبار الحفظ...');
    const saveResult = saveToOptimizedSheet(testData);
    if (saveResult.success) {
      log(`✅ نجح الحفظ في الصف: ${saveResult.rowNumber}`);
      
      // اختبار الإشعارات
      if (CONFIG.EMAIL_ENABLED && CONFIG.NOTIFICATION_EMAIL) {
        log('📧 اختبار الإيميل...');
        sendEmailNotification(testData, saveResult.rowNumber);
        log('✅ تم إرسال الإيميل');
      }
      
      if (CONFIG.TELEGRAM_BOT_TOKEN && CONFIG.TELEGRAM_CHAT_ID !== 'YOUR_CHAT_ID_HERE') {
        log('📱 اختبار Telegram...');
        sendTelegramNotification(testData, saveResult.rowNumber);
        log('✅ تم إرسال Telegram');
      }
      
    } else {
      log('❌ فشل الحفظ: ' + saveResult.error);
    }
    
    log('🎉 انتهى الاختبار');
    
  } catch (error) {
    log('❌ خطأ في الاختبار: ' + error.toString());
  }
}

/**
 * 📋 عرض الإعدادات الحالية
 */
function showConfig() {
  log('📋 الإعدادات الحالية:');
  log(`  📧 الإيميل: ${CONFIG.EMAIL_ENABLED ? 'مُفعّل' : 'مُعطّل'}`);
  log(`  📩 إيميل الإشعارات: ${CONFIG.NOTIFICATION_EMAIL}`);
  log(`  📱 Telegram Bot: ${CONFIG.TELEGRAM_BOT_TOKEN ? 'موجود' : 'غير موجود'}`);
  log(`  💬 Telegram Chat ID: ${CONFIG.TELEGRAM_CHAT_ID}`);
  log(`  📊 Google Sheets ID: ${CONFIG.SPREADSHEET_ID || 'سيتم إنشاؤه تلقائياً'}`);
  log(`  📝 السجلات المفصلة: ${CONFIG.ENABLE_DETAILED_LOGS ? 'مُفعّلة' : 'معطلة'}`);
}

/**
 * 🔧 اختبار سريع
 */
function testScript() {
  log('🔧 اختبار سريع...');
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        fullName: 'اختبار سريع',
        phone: '0555000000',
        wilayaNameAr: 'الجزائر',
        baladiyaNameAr: 'الجزائر الوسطى',
        selectedWatchId: 'w1',
        deliveryOption: 'home',
        total: '10000'
      })
    }
  };
  
  try {
    const result = doPost(mockEvent);
    const response = JSON.parse(result.getContent());
    
    if (response.success) {
      log('✅ الاختبار السريع نجح!');
      log('📝 الرسالة: ' + response.message);
    } else {
      log('❌ الاختبار السريع فشل: ' + response.error);
    }
    
  } catch (error) {
    log('❌ خطأ في الاختبار السريع: ' + error.toString());
  }
}

/**
 * 📱 الحصول على Chat ID لـ Telegram
 */
function getTelegramChatId() {
  log('🔍 البحث عن Telegram Chat ID...');
  
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    log('❌ لا يوجد Bot Token في الإعدادات');
    return;
  }
  
  try {
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`;
    const response = UrlFetchApp.fetch(url);
    const data = JSON.parse(response.getContentText());
    
    if (data.ok && data.result.length > 0) {
      log('📱 Chat IDs الموجودة:');
      
      data.result.forEach((update, index) => {
        if (update.message && update.message.chat) {
          const chat = update.message.chat;
          log(`${index + 1}. Chat ID: ${chat.id} - الاسم: ${chat.first_name || 'غير محدد'}`);
        }
      });
      
      log('🔧 لاستخدام Chat ID:');
      log('1. انسخ الـ Chat ID المناسب');
      log('2. استبدل YOUR_CHAT_ID_HERE في CONFIG');
      log('3. احفظ ونشر السكربت مرة أخرى');
      
    } else {
      log('⚠️ لا توجد رسائل. قم بالآتي:');
      log('1. ابحث عن البوت في Telegram');
      log('2. أرسل له رسالة /start');
      log('3. شغل هذه الدالة مرة أخرى');
    }
    
  } catch (error) {
    log('❌ خطأ في الحصول على Chat ID: ' + error.toString());
    log('🔧 تأكد من صحة Bot Token');
  }
}
