import { NextRequest, NextResponse } from 'next/server';

// Google Apps Script URL - ضع هنا الـ URL الجديد
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzlZo-iqI8X5JHljnzMuuIaAWpIFrgifnFO6kfHXeH3FRurybAcDikQfLirwQ6sGPzYjg/exec';

export async function POST(request: NextRequest) {
  try {
    // الحصول على البيانات من الطلب
    const orderData = await request.json();
    
    console.log('📦 Received order data:', orderData);
    // تحقق مبسط من البيانات المطلوبة قبل الإرسال
    if (!orderData?.fullName || !orderData?.phone || !orderData?.wilayaNameAr || !orderData?.baladiyaNameAr) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير مكتملة: الاسم، الهاتف، الولاية، البلدية مطلوبة.' },
        { status: 400 }
      );
    }
    
    // إعداد مهلة قصيرة للاستجابة السريعة للمستخدم
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    let respondedQuickly = false;

    try {
      // إرسال البيانات إلى Google Apps Script مع مهلة
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 Google Script response status:', response.status);

      if (!response.ok) {
        console.error('❌ Google Script error:', response.statusText);
        // نرجع نجاح للمستخدم مع متابعة خلف الكواليس
        respondedQuickly = true;
        // محاولة إعادة الإرسال بدون انتظار (خلف الكواليس)
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        }).catch((err) => console.error('Background resend failed:', err));

        return NextResponse.json(
          { success: true, message: 'تم استلام طلبك 👍 سيتم تأكيده قريباً.' },
          {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }

      const result = await response.text();
      console.log('✅ Google Script response:', result);

      // محاولة تحليل الاستجابة كـ JSON
      let jsonResult;
      try {
        jsonResult = JSON.parse(result);
      } catch {
        jsonResult = { success: true, message: 'تم استلام طلبك بنجاح' };
      }

      return NextResponse.json(jsonResult, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (err) {
      // في حال المهلة/انقطاع الشبكة: نعيد نجاح سريع ونحاول الإرسال بالخلفية
      if (!respondedQuickly) {
        clearTimeout(timeoutId);
        // محاولة خلفية دون انتظار
        fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        }).catch((e) => console.error('Background send failed:', e));

        return NextResponse.json(
          { success: true, message: 'تم استلام طلبك ويجري تأكيده 📞' },
          {
            status: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            },
          }
        );
      }
      throw err;
    }
    
  } catch (error) {
    console.error('💥 API Route Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'حدث خطأ في معالجة طلبك. حاول مرة أخرى.' 
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
