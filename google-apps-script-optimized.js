/**
 * Google Apps Script - مبسط: استلام الطلبات (Google Sheet + Email فقط)
 * تمت إزالة Telegram وكل التعقيدات السابقة لتقليل الأخطاء.
 */

const CONFIG = {
  EMAIL_ENABLED: true,
  NOTIFICATION_EMAIL: 'kalijeogo@gmail.com',
  SPREADSHEET_TITLE: 'طلبات الساعات', // البحث بالاسم فقط
  SHEET_NAME: 'الطلبات',
  ENABLE_LOGS: true
};

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
  'حالة الطلب'
];

function log(msg){ if(CONFIG.ENABLE_LOGS) console.log(`[LOG ${new Date().toISOString()}] ${msg}`); }

function doPost(e){
  try {
    if(!e || !e.postData || !e.postData.contents){
      return jsonError('لا توجد بيانات');
    }
    const data = JSON.parse(e.postData.contents);
    log('بيانات مستلمة: ' + JSON.stringify(data));

    const validation = validate(data);
    if(!validation.valid){
      return jsonError('بيانات ناقصة: ' + validation.missing.join(', '));
    }

    // تنفيذ عملية الحفظ (تشمل كشف التكرار)
    const saveResult = saveOrder(data);
    if(!saveResult.success){
      return jsonError(saveResult.message || 'فشل حفظ البيانات');
    }

    // لو كان مكرر لا نُرسل إيميل
    if(saveResult.duplicate){
      return jsonSuccess({
        message: saveResult.message,
        row: saveResult.rowNumber,
        duplicate: true
      });
    }

    // إرسال الإيميل
    let emailInfo = { success: false, message: 'لم يتم إرسال الإيميل' };
    if(CONFIG.EMAIL_ENABLED && CONFIG.NOTIFICATION_EMAIL){
      emailInfo = sendOrderEmail(data, saveResult.rowNumber);
    }

    return jsonSuccess({
      message: saveResult.message,
      row: saveResult.rowNumber,
      emailMessage: emailInfo.message
    });
  } catch(err){
    log('خطأ عام: ' + err);
    return jsonError('خطأ داخلي');
  }
}

// دالة موحدة للحفظ + كشف التكرار تُرجع رسالة واضحة
function saveOrder(data){
  try {
    const id = data.clientRequestId;
    if(id){
      const processed = loadProcessedMap();
      if(processed[id]){
        log('🔁 طلب مكرر بنفس المعرف، لن نحفظ مرة أخرى');
        return { success: true, duplicate: true, rowNumber: processed[id].r, message: '✅ تم استلام طلبك (مكرر)' };
      }
    } else {
      const dupRow = findRecentDuplicate(data);
      if(dupRow){
        log('🔁 كشف تكرار بالتحليل بدون معرف – تخطي الحفظ');
        return { success: true, duplicate: true, rowNumber: dupRow, message: '✅ تم استلام طلبك (مكرر)' };
      }
    }

    const saved = saveRow(data);
    if(!saved.success){
      return { success: false, message: 'فشل حفظ البيانات' };
    }

    if(id){
      rememberProcessed(id, saved.rowNumber);
    }

    return { success: true, duplicate: false, rowNumber: saved.rowNumber, message: '✅ تم استلام طلبك بنجاح' };
  } catch(err){
    log('⚠️ saveOrder خطأ: ' + err);
    return { success: false, message: 'خطأ أثناء حفظ الطلب' };
  }
}

function validate(d){
  const required = ['fullName','phone','wilayaNameAr','baladiyaNameAr','selectedWatchId','deliveryOption','total'];
  const missing = required.filter(k => !d[k] && d[k] !== 0);
  return { valid: missing.length === 0, missing };
}

function translateWatch(id){
  if(!id) return 'غير محدد';
  if(/^w\d+$/.test(id)) return 'ساعة رقم ' + id.replace('w','');
  return id;
}

/**
 * الحصول على / إنشاء الجدول مع تخزين الـ ID في Script Properties لو فشل القديم
 */
function getSheet(){
  // ابحث عن Spreadsheet بالعنوان المحدد
  let ss = findSpreadsheetByTitle(CONFIG.SPREADSHEET_TITLE);
  if(!ss){
    ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_TITLE);
    log('🆕 تم إنشاء Spreadsheet جديد بالعنوان: ' + CONFIG.SPREADSHEET_TITLE);
  }
  // الحصول على الورقة المطلوبة
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if(!sheet){
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const defaultSheet = ss.getSheetByName('Sheet1');
    if(defaultSheet && defaultSheet.getSheetId() !== sheet.getSheetId()){
      try { ss.deleteSheet(defaultSheet); } catch { /* ignore */ }
    }
  }
  // ضبط الرؤوس لو كانت فارغة
  if(sheet.getLastRow() === 0){
    sheet.getRange(1,1,1,SHEET_HEADERS.length).setValues([SHEET_HEADERS]);
    sheet.getRange(1,1,1,SHEET_HEADERS.length).setFontWeight('bold').setBackground('#222').setFontColor('#fff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function findSpreadsheetByTitle(title){
  const files = DriveApp.getFilesByName(title);
  while(files.hasNext()){
    const file = files.next();
    try { return SpreadsheetApp.open(file); } catch { /* تجاهل المعطوب */ }
  }
  return null;
}

function saveRow(d){
  try {
    const sheet = getSheet();
    const now = Utilities.formatDate(new Date(),'Africa/Algiers','dd/MM/yyyy HH:mm:ss');
    const row = [
      now,
      (d.fullName||'').toString().trim(),
      (d.phone||'').toString().trim(),
      d.wilayaNameAr||'',
      d.baladiyaNameAr||'',
      translateWatch(d.selectedWatchId),
      d.deliveryOption === 'home' ? 'المنزل' : 'المكتب',
  d.total + ' دج',
  (d.notes !== undefined && d.notes !== null && String(d.notes).trim() !== '' ? String(d.notes).trim() : '—'),
      'جديد'
    ];
    const rowIndex = sheet.getLastRow() + 1;
    sheet.getRange(rowIndex,1,1,row.length).setValues([row]);
    return { success: true, rowNumber: rowIndex };
  } catch(e){
    log('حفظ فشل: ' + e);
    return { success: false, error: e.toString() };
  }
}

function sendOrderEmail(d, rowNumber){
  try {
    const subject = `🔔 طلب جديد #${rowNumber} - ${d.fullName}`;
    const html = `
      <div style="font-family:Arial;padding:16px;background:#f6f6f6;direction:rtl;text-align:right">
        <h2 style="margin-top:0">طلب جديد</h2>
        <table style="width:100%;border-collapse:collapse;background:#fff">
          <tr><td style="padding:8px;border:1px solid #ddd">الاسم</td><td style="padding:8px;border:1px solid #ddd">${d.fullName}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">الهاتف</td><td style="padding:8px;border:1px solid #ddd">${d.phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">الولاية</td><td style="padding:8px;border:1px solid #ddd">${d.wilayaNameAr}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">البلدية</td><td style="padding:8px;border:1px solid #ddd">${d.baladiyaNameAr}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">الساعة</td><td style="padding:8px;border:1px solid #ddd">${translateWatch(d.selectedWatchId)}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">التوصيل</td><td style="padding:8px;border:1px solid #ddd">${d.deliveryOption==='home'?'المنزل':'المكتب'}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd">المبلغ</td><td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:#0a7">${d.total} دج</td></tr>
          ${d.notes?`<tr><td style='padding:8px;border:1px solid #ddd'>ملاحظات</td><td style='padding:8px;border:1px solid #ddd'>${d.notes}</td></tr>`:''}
        </table>
        <p style="font-size:12px;color:#666;margin-top:16px">الصف: #${rowNumber} | الوقت: ${new Date().toLocaleString('ar-DZ',{timeZone:'Africa/Algiers'})}</p>
        <p><a href="${getSpreadsheetUrl()}" style="background:#0a7;color:#fff;padding:8px 14px;text-decoration:none;border-radius:4px">فتح الجدول</a></p>
      </div>`;
    GmailApp.sendEmail(CONFIG.NOTIFICATION_EMAIL, subject, '', { htmlBody: html, name: 'نظام الطلبات' });
    return { success: true, message: '✉️ تم إرسال الإيميل' };
  } catch(e){
    log('خطأ إيميل: ' + e);
    return { success: false, message: '⚠️ فشل إرسال الإيميل' };
  }
}

function getSpreadsheetUrl(){
  // إعادة بناء الرابط بأخذ أول ملف مطابق (للعرض فقط)
  const ss = findSpreadsheetByTitle(CONFIG.SPREADSHEET_TITLE);
  return ss ? ss.getUrl() : '#';
}

// ================== إدارة التكرارات ==================
function loadProcessedMap(){
  const props = PropertiesService.getScriptProperties();
  try { return JSON.parse(props.getProperty('PROCESSED_MAP')||'{}'); } catch { return {}; }
}
function saveProcessedMap(map){
  const props = PropertiesService.getScriptProperties();
  // تقليل الحجم لو تعدى 300
  const keys = Object.keys(map);
  if(keys.length > 300){
    // فرز حسب الزمن ثم الاحتفاظ بـ 200 الأخيرة
    keys.sort((a,b)=> map[b].t - map[a].t);
    const trimmed = {};
    for(let i=0;i<200;i++){ trimmed[keys[i]] = map[keys[i]]; }
    map = trimmed;
  }
  props.setProperty('PROCESSED_MAP', JSON.stringify(map));
}
function rememberProcessed(id, row){
  if(!id) return;
  const map = loadProcessedMap();
  map[id] = { r: row, t: Date.now() };
  saveProcessedMap(map);
}
function parseDateTime(dt){
  // تنسيق dd/MM/yyyy HH:mm:ss
  const parts = dt.split(' ');
  if(parts.length !== 2) return null;
  const d = parts[0].split('/');
  const t = parts[1].split(':');
  if(d.length!==3||t.length!==3) return null;
  return new Date(Number(d[2]), Number(d[1])-1, Number(d[0]), Number(t[0]), Number(t[1]), Number(t[2]));
}
function findRecentDuplicate(d){
  try {
    const sheet = getSheet();
    const last = sheet.getLastRow();
    if(last < 2) return null; // لا بيانات
    const look = Math.min(60, last-1); // آخر 60 صف
    const start = last - look + 1;
    const values = sheet.getRange(start,1,look,10).getValues();
    const now = Date.now();
    const totalStr = d.total + ' دج';
    for(let i=values.length-1;i>=0;i--){
      const row = values[i];
      const dt = parseDateTime(row[0]);
      if(!dt) continue;
      if(now - dt.getTime() > 5*60*1000) break; // أقدم من 5 دقائق نتوقف
      if(String(row[2]).trim() === String(d.phone).trim() &&
         String(row[5]).trim() === translateWatch(d.selectedWatchId) &&
         String(row[3]).trim() === String(d.wilayaNameAr).trim() &&
         String(row[4]).trim() === String(d.baladiyaNameAr).trim() &&
         String(row[7]).trim() === totalStr){
           // صف مطابق
           return start + i; // رقم الصف الحقيقي
         }
    }
    return null;
  } catch(err){
    log('⚠️ فشل كشف التكرار: ' + err);
    return null;
  }
}

function jsonSuccess(obj){
  return ContentService.createTextOutput(JSON.stringify({ success:true, ...obj })).setMimeType(ContentService.MimeType.JSON);
}
function jsonError(message){
  return ContentService.createTextOutput(JSON.stringify({ success:false, error: message })).setMimeType(ContentService.MimeType.JSON);
}

// اختبار سريع داخل بيئة Apps Script
// function testScript(){
//   const mock = { postData: { contents: JSON.stringify({
//     fullName: 'اختبار',
//     phone: '0555000000',
//     wilayaNameAr: 'الجزائر',
//     baladiyaNameAr: 'بئر مراد رايس',
//     selectedWatchId: 'w3',
//     deliveryOption: 'home',
//     total: 3200,
//     notes: 'ملاحظة تجريبية'
//   }) } };
//   const res = doPost(mock);
//   log('نتيجة الاختبار: ' + res.getContent());
// }