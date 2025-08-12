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

// Single attempt with ONE optional retry (same clientRequestId) to avoid duplicate emails
async function sendOnceWithOptionalRetry(orderData: Record<string, unknown>): Promise<ScriptResponse> {
  const attemptSend = async (label: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout
    try {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'BSMonsters-API/1.0' },
        body: JSON.stringify(orderData),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const text = await res.text();
  let json: ScriptResponse;
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if(!res.ok) throw new Error('HTTP '+res.status+' '+res.statusText);
      return json;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`Attempt ${label} failed:`, err instanceof Error ? err.message : err);
      throw err;
    }
  };
  try {
    return await attemptSend('primary');
  } catch {
    // network abort or transient error => one retry after short pause
    await new Promise(r=>setTimeout(r, 1200));
    return await attemptSend('retry');
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
    
    // إرسال متحكم (محاولة + إعادة واحدة فقط)
  let scriptResponse: ScriptResponse | undefined;
    try {
      scriptResponse = await sendOnceWithOptionalRetry(orderData);
    } catch (finalErr){
      console.error('Script send failed after retry:', finalErr);
      // نرجع نجاحاً متفائلاً لأن الواجهة لا يجب أن تعيد الإرسال (لدينا معرف منع تكرار)
      return NextResponse.json(
        { success: true, optimistic: true, message: 'تم استلام طلبك (سيتم تأكيده هاتفياً)' },
        { status: 200, headers: corsHeaders() }
      );
    }

    // استجابة السكربت (قد يكون raw)
    if(!scriptResponse || typeof scriptResponse !== 'object'){
      scriptResponse = { success: true, message: 'تم استلام طلبك' };
    }
    // ضمان success=true (السكريبت يُرجع success عند الحفظ)
    if(scriptResponse.success !== false){
      scriptResponse.clientRequestId = orderData.clientRequestId;
    }
    return NextResponse.json(scriptResponse, { status: 200, headers: corsHeaders() });
    
  } catch (error) {
    console.error('💥 API Route Error:', error);
    
    return NextResponse.json(
      { success: false, error: 'خطأ داخلي غير متوقع' },
      { status: 500, headers: corsHeaders() }
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
