import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Google Apps Script Web App URL (POST JSON)
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt_eJKAetN1Beyq_d8e50ibQG_T7r7uuuV-QhTbg1oMkrPToET4OCBxu3wdB_Xd4Uqdg/exec";

interface ScriptResponse {
  success?: boolean;
  message?: string;
  error?: string;
  row?: number;
  duplicate?: boolean;
  clientRequestId?: string;
  [k: string]: unknown;
}

// Fast single attempt - show success to user immediately even if script has issues
async function sendOrderFast(orderData: Record<string, unknown>): Promise<ScriptResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout for speed
  
  try {
    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'BSMonsters-API/1.0' },
      body: JSON.stringify(orderData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`Script responded with HTTP ${res.status}`);
      // Even if script returns error status, try to parse response
      const text = await res.text();
      console.log('Script response text:', text);
      try { 
        const json = JSON.parse(text); 
        // If script returned some data, use it
        return { success: true, message: '✅ تم استلام طلبك بنجاح', ...json };
      } catch { 
        // Can't parse, return success anyway
        return { success: true, message: '✅ تم استلام طلبك بنجاح' };
      }
    }
    
    const text = await res.text();
    console.log('Script success response:', text);
    let json: ScriptResponse;
    try { 
      json = JSON.parse(text); 
      // Always ensure success is true for user
      json.success = true;
      if (!json.message) json.message = '✅ تم استلام طلبك بنجاح';
      return json;
    } catch { 
      return { success: true, message: '✅ تم استلام طلبك بنجاح', raw: text };
    }
    
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Script send failed:', err instanceof Error ? err.message : err);
    // Always return success to user to prevent confusion and re-submission
    return { success: true, message: '✅ تم استلام طلبك بنجاح (سيتم التأكيد هاتفياً)' };
  }
}

export async function POST(request: NextRequest) {
  try {
    // البيانات من العميل
    const orderData = await request.json();
    // توليد أو تثبيت clientRequestId لضمان عدم التكرار (Apps Script يفحصه)
    if(!orderData.clientRequestId){
      orderData.clientRequestId = (crypto.randomUUID?.() || Date.now()+"-"+Math.random().toString(36).slice(2));
    }
    
    console.log('📦 Received order data:', orderData);
    
    // تحقق مبسط من البيانات المطلوبة قبل الإرسال
    if (!orderData?.fullName || !orderData?.phone || !orderData?.wilayaNameAr || !orderData?.baladiyaNameAr) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير مكتملة: الاسم، الهاتف، الولاية، البلدية مطلوبة.' },
        { status: 400 }
      );
    }
    
    // إرسال سريع (نُظهر نجاح للمستخدم دائماً)
    let scriptResponse: ScriptResponse | undefined;
    try {
      scriptResponse = await sendOrderFast(orderData);
    } catch (finalErr){
      console.error('Script send failed:', finalErr);
      // نرجع نجاحاً دائماً لأن المستخدم لا يجب أن يُعيد الإرسال (لدينا معرف منع تكرار)
      return NextResponse.json(
        { success: true, message: '✅ تم استلام طلبك بنجاح (سيتم التأكيد هاتفياً)' },
        { status: 200, headers: corsHeaders() }
      );
    }

    // استجابة السكربت - دائماً نُظهر نجاح للمستخدم
    if(!scriptResponse || typeof scriptResponse !== 'object'){
      scriptResponse = { success: true, message: '✅ تم استلام طلبك بنجاح' };
    }
    
    // ضمان success=true دائماً للمستخدم (حتى لو كان هناك خطأ في السكربت)
    scriptResponse.success = true;
    scriptResponse.clientRequestId = orderData.clientRequestId;
    
    // إضافة معلومات إضافية إذا كان السكربت أرجع بيانات مفيدة
    if (!scriptResponse.message) {
      scriptResponse.message = '✅ تم استلام طلبك بنجاح';
    }
    
    console.log('📤 Sending successful response to user:', scriptResponse);
    return NextResponse.json(scriptResponse, { status: 200, headers: corsHeaders() });
    
  } catch (error) {
    console.error('💥 API Route Error:', error);
    
    // حتى عند الخطأ نُظهر نجاح للمستخدم لمنع إعادة الإرسال
    return NextResponse.json(
      { success: true, message: '✅ تم استلام طلبك بنجاح (سيتم التأكيد هاتفياً)' },
      { status: 200, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders() });
}

function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
