"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import CountdownTimer from "../components/ui/CountdownTimer";
import wilayas from "./data/algerian-wilayas.json";
import cities from "./data/algeria-cities.json";
// Lucide Icons
import {
  Watch,
  Package2,
  ShieldCheck,
  TimerReset,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  CircleAlert,
  Phone,
  Info,
} from "lucide-react";

type DeliveryOption = "home" | "office";

type FormData = {
  fullName: string;
  phone: string;
  wilayaId?: number;
  baladiya?: string;
  notes?: string;
};

type WatchItem = { id: string; name: string; image: string };

// Types for JSON data
type WilayaItem = { id: number; name_ar: string; name_fr?: string };
type CityWilaya = {
  code: string;
  name_ar: string;
  name_fr?: string;
  baladiyat: Array<{ name_ar: string; name_fr?: string }>;
};
type CitiesData = { wilayas: CityWilaya[] };

// Data
const WATCHES: WatchItem[] = Array.from({ length: 20 }).map((_, i) => {
  const idx = i + 1;
  return { id: `w${idx}`, name: `ساعة رقم ${idx}`, image: `/images/watches/${idx}.jpg` };
});

// Pricing
const BASE_PRICE = 2500; // دج السعر للعرض (حسب الطلب الأخير)
const DELIVERY_COST: Record<DeliveryOption, number> = {
  home: 700,
  office: 450,
};

// API endpoint
const API_URL = "/api/submit-order";

// Helpers
const pad2 = (n: number) => n.toString().padStart(2, "0");

// Meta Pixel safe tracker
declare global {
  interface Window {
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>) => void;
  }
}
function trackFb(event: string, params?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", event, params);
    } catch {}
  }
}
function useWilayaOptions() {
  // Sort by id to keep consistent order
  const options = useMemo(
    () =>
      (wilayas as Array<WilayaItem>)
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((w) => ({ value: w.id, label: w.name_ar })),
    []
  );
  return options;
}

function useBaladiyaOptions(wilayaId?: number) {
  const list = useMemo(() => {
    if (!wilayaId) return [] as string[];
    const code = pad2(wilayaId);
    const wilaya = (cities as CitiesData).wilayas.find((w) => w.code === code);
    if (!wilaya) return [] as string[];
    const names: string[] = (wilaya.baladiyat || [])
      .map((b) => (b?.name_ar || "").toString().trim())
      .filter(Boolean);
    // unique + sort
    const unique: string[] = Array.from(new Set(names));
    unique.sort((a: string, b: string) => a.localeCompare(b, "ar"));
    return unique;
  }, [wilayaId]);
  return list;
}

function formatDZD(v: number) {
  try {
    return new Intl.NumberFormat("ar-DZ").format(v) + " دج";
  } catch {
    return v.toLocaleString() + " دج";
  }
}

export default function Page() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption | null>(null);
  const [formData, setFormData] = useState<FormData>({ fullName: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const wilayaOptions = useWilayaOptions();
  const baladiyaOptions = useBaladiyaOptions(formData.wilayaId);

  const total = useMemo(() => BASE_PRICE + (deliveryOption ? DELIVERY_COST[deliveryOption] : 0), [deliveryOption]);

  // Clear baladiya when wilaya changes
  useEffect(() => {
    setFormData((fd) => ({ ...fd, baladiya: undefined }));
  }, [formData.wilayaId]);

  const validateStep5 = () => {
    const errs: Record<string, string> = {};
    const name = formData.fullName?.trim() || "";
    const phone = (formData.phone || "").replace(/\D/g, "");
    if (name.length < 2) errs["fullName"] = "الاسم الكامل مطلوب (حرفان على الأقل).";
    if (phone.length < 9 || phone.length > 13) errs["phone"] = "رقم هاتف غير صالح.";
    if (!formData.wilayaId) errs["wilayaId"] = "الولاية مطلوبة.";
    if (!formData.baladiya) errs["baladiya"] = "البلدية مطلوبة.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Watch selection handler with Pixel event
  const handleSelectWatch = (id: string) => {
    setSelectedWatchId(id);
    const w = WATCHES.find((x) => x.id === id);
    trackFb("AddToCart", {
      content_type: "product",
      content_ids: [id],
      content_name: w?.name,
      value: BASE_PRICE,
      currency: "DZD",
    });
    // Auto scroll selected into view when in carousel mode
    if (viewMode === 'carousel' && carouselRef.current) {
      const el = carouselRef.current.querySelector<HTMLButtonElement>(`[data-watch='${id}']`);
      if (el) {
        el.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  // Accessibility: reduce motion preference
  // const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Design helpers
  const glass = "bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]";
  const panel = "rounded-2xl p-6 md:p-8 " + glass;
  const heading = "font-extrabold tracking-tight";
  // const subtle = "text-slate-600";
  // const accentGradient = "bg-gradient-to-r from-red-600 via-rose-500 to-red-600";

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-gradient-to-br from-slate-100 via-white to-rose-50 text-slate-900 selection:bg-red-600/70 selection:text-white">
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="mx-auto w-full max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-inner shadow-red-900/10 bg-gradient-to-br from-red-600 to-rose-600">
              <Watch className="w-6 h-6" />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg md:text-xl font-bold">BS MONTERS</h1>
              <p className="text-xs md:text-sm text-slate-600">متجر الهدايا و الساعات الفاخرة</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-500">السعر الحالي</div>
            <div className="text-2xl md:text-3xl font-extrabold text-rose-600">
              {formatDZD(BASE_PRICE)}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero / Offer */}
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 pt-8 pb-14 md:pt-10 md:pb-16">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              {/* Image FIRST (mobile & DOM) */}
              <div className="order-1 lg:order-none">
                <figure className="relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5 bg-white">
                  <Image src="/images/box/box.jpg" alt="صورة العرض - الصندوق" width={1000} height={700} priority className="w-full h-64 md:h-96 object-cover" />
                  <figcaption className="absolute top-3 right-3 text-[11px] md:text-xs bg-rose-600 text-white px-3 py-1 rounded-full flex items-center gap-1 shadow">
                    <TimerReset className="w-3 h-3" /> عرض 3 أيام فقط
                  </figcaption>
                </figure>
              </div>

              {/* Text */}
              <div className="space-y-6">
                <h2 className="text-2xl md:text-3xl font-extrabold leading-relaxed text-slate-900">
                  عرض خاص لمدة 3 أيام فقط
                </h2>
                <div className="space-y-3 text-base md:text-lg font-medium text-slate-800 leading-relaxed">
                  <p>ساعة + خاتم + براسلي + علبة مجانية</p>
                  <p>وزيد بارفان Sauvage قارورة كبيرة هدية من عندنا</p>
                  <p>+ ببرتموني Jeep كاليتي ماشاء الله بالضمان</p>
                  <p className="text-rose-600 font-extrabold text-xl md:text-2xl">كل هذا بسعر خيالي {formatDZD(BASE_PRICE)} فقط</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="#select" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-sm md:text-base font-semibold shadow hover:brightness-110">
                    <ShoppingCart className="w-5 h-5" /> اختر ساعتك الآن
                  </a>
                  <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> بالضمان
                  </div>
                </div>
                <div className="w-full max-w-xs rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
                  <div className="text-xs font-medium text-rose-600 mb-2 flex items-center justify-center gap-1"><TimerReset className="w-4 h-4" /> ينتهي خلال:</div>
                  <CountdownTimer />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Watch Selection */}
        <section id="select" data-watch-section className="py-14 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
              <div>
                <h3 className={`${heading} text-2xl md:text-3xl text-slate-900 mb-3`}>اختر موديل الساعة</h3>
                <p className="text-sm md:text-base text-slate-600 max-w-xl">20 موديل مختلف – نفس السعر. اختر ساعة واضحة بحجم أكبر للمعاينة.</p>
              </div>
              <div className="flex flex-wrap gap-2 items-center text-xs text-slate-500">
                {selectedWatchId && <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 className="w-4 h-4" /> تم اختيار موديل</div>}
              </div>
            </div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] md:text-xs text-slate-500">
                <Info className="w-4 h-4" /> اختر الطريقة المريحة للتصفح
              </div>
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button type="button" onClick={() => setViewMode('carousel')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode==='carousel' ? 'bg-white shadow text-rose-600' : 'text-slate-600 hover:text-slate-800'}`}>تمرير</button>
                <button type="button" onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${viewMode==='grid' ? 'bg-white shadow text-rose-600' : 'text-slate-600 hover:text-slate-800'}`}>شبكة</button>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/5 p-4 md:p-6 bg-white/80 backdrop-blur-xl">
              {viewMode === 'carousel' && (
                <div className="relative">
                  <div ref={carouselRef} className="flex gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent" dir="ltr">
                    {WATCHES.map((watch, index) => {
                      const selected = selectedWatchId === watch.id;
                      return (
                        <button
                          data-watch={watch.id}
                          key={watch.id}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`موديل ${index + 1}`}
                          onClick={() => handleSelectWatch(watch.id)}
                          className={`snap-center shrink-0 relative w-[140px] h-[140px] md:w-[170px] md:h-[170px] rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-600 transition ring-1 ring-slate-200 ${selected ? 'ring-2 !ring-rose-500 shadow-lg scale-[1.02]' : 'hover:shadow-md'}`}
                        >
                          <Image src={watch.image} alt={`موديل ${index+1}`} fill sizes="170px" quality={85} className="object-cover" priority={index < 5} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 hover:opacity-100 transition" />
                          <div className="absolute bottom-2 inset-x-2 text-[11px] font-semibold text-white/95 text-center bg-black/40 rounded-md py-1 backdrop-blur-sm">موديل {index+1}</div>
                          {selected && <div className="absolute top-2 left-2 bg-emerald-500/90 text-white rounded-full p-1 shadow"><CheckCircle2 className="w-4 h-4" /></div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-5">
                  {WATCHES.map((watch, index) => {
                    const selected = selectedWatchId === watch.id;
                    return (
                      <button
                        key={watch.id}
                        type="button"
                        aria-pressed={selected}
                        aria-label={`اختيار موديل ${index + 1}`}
                        onClick={() => handleSelectWatch(watch.id)}
                        className={`group relative rounded-2xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-600 transition-all ring-1 ring-slate-200 ${selected ? 'shadow-lg ring-2 !ring-rose-500 scale-[1.02]' : 'hover:shadow-md'}`}
                        style={{aspectRatio:'1/1'}}
                      >
                        <Image src={watch.image} alt={`موديل ساعة رقم ${index + 1}`} fill sizes="180px" quality={85} className="object-cover" priority={index < 6} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition" />
                        <div className="absolute bottom-2 inset-x-2 text-[11px] md:text-xs font-semibold tracking-tight text-white/95 text-center bg-black/40 rounded-md py-1 backdrop-blur-sm">موديل {index + 1}</div>
                        {selected && (
                          <div className="absolute top-2 left-2 bg-emerald-500/90 text-white rounded-full p-1 shadow">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {!selectedWatchId && (
                <div className="mt-5 flex items-center justify-center gap-2 text-xs md:text-sm text-slate-600">
                  <CircleAlert className="w-4 h-4 text-amber-500" /> اضغط على أي موديل لاختياره
                </div>
              )}
              {selectedWatchId && (
                <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t pt-6 border-slate-200">
                  <div className="flex items-center gap-5">
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden ring-2 ring-rose-500/40 shadow-md">
                      <Image src={WATCHES.find(w => w.id === selectedWatchId)?.image || "/images/watches/1.jpg"} alt="الساعة المختارة" fill sizes="128px" className="object-cover" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-base md:text-lg font-bold text-slate-800">الموديل المختار</p>
                      <p className="text-xs md:text-sm text-slate-500">يمكنك التغيير قبل إرسال الطلب</p>
                    </div>
                  </div>
                  <a href="#order" className="inline-flex items-center gap-2 text-sm md:text-base font-semibold px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white shadow hover:brightness-110">
                    <ShoppingCart className="w-5 h-5" /> متابعة للبيانات
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Order Form */}
        <section id="order" className="py-16 md:py-20 bg-gradient-to-t from-white to-transparent">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="text-center mb-8">
            <h2 className={`${heading} text-2xl md:text-3xl text-slate-900 mb-3`}>بيانات الطلب</h2>
            <p className="text-sm md:text-base text-slate-600 max-w-2xl mx-auto">املأ معلوماتك وسيتم الاتصال بك لتأكيد الطلب. الدفع عند الاستلام.</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-3 bg-rose-50 text-rose-700 text-xs md:text-sm font-semibold ring-1 ring-rose-600/10">
              <Package2 className="w-4 h-4" /> الإجمالي: {formatDZD(total)}
            </div>
          </div>
          <div className={`${panel} p-6 md:p-8`}>
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (!selectedWatchId) {
                setErrors({ watch: "يرجى اختيار ساعة أولاً" });
                document.querySelector('[data-watch-section]')?.scrollIntoView({ behavior: 'smooth' });
                return;
              }

              if (!validateStep5()) {
                return;
              }

              setIsSubmitting(true);
              setSubmitError(null);

              try {
                const orderData = {
                  fullName: formData.fullName,
                  phone: formData.phone,
                  wilayaId: formData.wilayaId,
                  wilayaNameAr: wilayaOptions.find(w => w.value === formData.wilayaId)?.label,
                  baladiya: formData.baladiya,
                  baladiyaNameAr: formData.baladiya,
                  selectedWatchId,
                  deliveryOption: deliveryOption || "home",
                  total,
                  notes: formData.notes,
                  clientRequestId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                };

                const response = await fetch(API_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(orderData),
                });

                const result = await response.json();

                if (result.success) {
                  trackFb("Purchase", {
                    content_type: "product",
                    content_ids: [selectedWatchId],
                    value: total,
                    currency: "DZD",
                  });
                  setShowSuccess(true);
                } else {
                  setSubmitError(result.error || "حدث خطأ غير متوقع");
                }
              } catch {
                setSubmitError("فشل في الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
              } finally {
                setIsSubmitting(false);
              }
            }} className="space-y-6">
              
              {/* Customer Info */}
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-describedby="personal-info-desc">
                <legend className="sr-only">معلومات شخصية</legend>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="أحمد محمد"
                      className={`w-full rounded-xl bg-white border-2 pl-4 pr-12 py-4 text-base focus:outline-none focus:border-blue-500 ${
                        errors["fullName"] ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  {errors["fullName"] && (
                    <p className="text-red-600 text-sm mt-1">{errors["fullName"]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0555 123 456"
                      className={`w-full rounded-xl bg-white border-2 pl-4 pr-12 py-4 text-base focus:outline-none focus:border-blue-500 ${
                        errors["phone"] ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                  </div>
                  {errors["phone"] && (
                    <p className="text-red-600 text-sm mt-1">{errors["phone"]}</p>
                  )}
                </div>
              </fieldset>

              {/* Location */}
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-describedby="location-info-desc">
                <legend className="sr-only">معلومات الموقع</legend>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    الولاية
                  </label>
                  <div className="relative">
                    <select
                      value={formData.wilayaId || ""}
                      onChange={(e) => setFormData(f => ({ ...f, wilayaId: e.target.value ? Number(e.target.value) : undefined }))}
                      className={`w-full rounded-xl bg-white border-2 pl-4 pr-12 py-4 text-base focus:outline-none focus:border-blue-500 ${
                        errors["wilayaId"] ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">اختر الولاية</option>
                      {wilayaOptions.map((w) => (
                        <option key={w.value} value={w.value}>{w.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  {errors["wilayaId"] && (
                    <p className="text-red-600 text-sm mt-1">{errors["wilayaId"]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-800">
                    البلدية
                  </label>
                  <div className="relative">
                    <select
                      value={formData.baladiya || ""}
                      onChange={(e) => setFormData(f => ({ ...f, baladiya: e.target.value }))}
                      disabled={!formData.wilayaId}
                      className={`w-full rounded-xl bg-white border-2 pl-4 pr-12 py-4 text-base focus:outline-none focus:border-blue-500 ${
                        errors["baladiya"] ? "border-red-500" : "border-gray-300"
                      } ${!formData.wilayaId ? "opacity-50 cursor-not-allowed" : ""}`}
                      required
                    >
                      <option value="">{formData.wilayaId ? "اختر البلدية" : "اختر الولاية أولاً"}</option>
                      {baladiyaOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  {errors["baladiya"] && (
                    <p className="text-red-600 text-sm mt-1">{errors["baladiya"]}</p>
                  )}
                </div>
              </fieldset>

              {/* Delivery Options */}
              <fieldset>
                <legend className="sr-only">طريقة التوصيل</legend>
                <label className="block text-sm font-semibold mb-4 text-gray-800">
                  طريقة التوصيل
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    deliveryOption === "home" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="home"
                      checked={deliveryOption === "home"}
                      onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">توصيل للمنزل</div>
                        <div className="text-sm text-gray-600">{formatDZD(DELIVERY_COST.home)} إضافية</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    deliveryOption === "office" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}>
                    <input
                      type="radio"
                      name="delivery"
                      value="office"
                      checked={deliveryOption === "office"}
                      onChange={(e) => setDeliveryOption(e.target.value as DeliveryOption)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">توصيل للمكتب</div>
                        <div className="text-sm text-gray-600">{formatDZD(DELIVERY_COST.office)} إضافية</div>
                      </div>
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Additional Notes */}
              <fieldset>
                <legend className="sr-only">ملاحظات إضافية</legend>
                <label className="block text-sm font-semibold mb-2 text-gray-800">
                  عنوان تفصيلي (اختياري)
                </label>
                <textarea
                  value={formData.notes ?? ""}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="مثال: بجانب المسجد، الطابق الثاني..."
                  className="w-full rounded-xl bg-white border-2 border-gray-300 px-4 py-4 text-base focus:outline-none focus:border-blue-500"
                />
              </fieldset>
                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedWatchId || !deliveryOption}
                    className="w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl text-base md:text-lg transition-all duration-300 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600 active:scale-[.985]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> جارٍ تأكيد طلبك...</span>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <ShoppingCart className="w-5 h-5" />
                        اطلب الآن - {formatDZD(total)}
                      </div>
                    )}
                  </button>

                  {!selectedWatchId && (
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-sm flex items-center justify-center gap-2">
                      <CircleAlert className="w-4 h-4" /> يرجى اختيار ساعة أولاً من القائمة أعلاه
                    </div>
                  )}

                  {selectedWatchId && !deliveryOption && (
                    <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-3 text-sky-800 text-sm flex items-center justify-center gap-2">
                      <Info className="w-4 h-4" /> يرجى اختيار طريقة التوصيل
                    </div>
                  )}

                  {submitError && (
                    <div role="alert" className="mt-4 bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-700 text-sm flex items-center justify-center gap-2">
                      <CircleAlert className="w-4 h-4" /> {submitError}
                    </div>
                  )}
                </div>
            </form>
          </div>
        </div>
        </section>
      </main>

  {/* Success Modal */}
  <AnimatePresence>
    {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
            >
      <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  تم استلام طلبك بنجاح!
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  سنتصل بك خلال 15 دقيقة لتأكيد الطلب وتحديد موعد التوصيل
                </p>
                <div className="bg-green-50 rounded-xl p-4 mt-4">
                  <div className="text-sm text-green-700">
                    <div className="font-semibold">رقم الطلب: #{Date.now().toString().slice(-6)}</div>
                    <div>التوصيل خلال 24-48 ساعة</div>
                    <div>الدفع عند الاستلام</div>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-3">
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setSelectedWatchId(null);
                    setDeliveryOption(null);
                    setFormData({ fullName: "", phone: "" });
                    setErrors({});
                    setSubmitError(null);
                  }}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 text-white font-medium py-3 px-6 rounded-xl transition"
                >
                  إغلاق والعودة
                </button>
                <a href="#select" className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 px-6 rounded-xl transition">
                  <Watch className="w-5 h-5" /> اختيار موديل آخر
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simple Footer */}
      <footer className="mt-20 bg-slate-900 text-slate-300 pt-10 pb-6">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg flex items-center justify-center bg-gradient-to-br from-rose-600 to-red-600 text-white">
              <Watch className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">BS MONTERS</p>
              <p className="text-xs text-slate-400">عرض محدود • ضمان</p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BS MONTERS
          </div>
        </div>
      </footer>

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/213776863561?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%B7%D9%84%D8%A8%20%D8%A7%D9%84%D8%B9%D8%B1%D8%B6%20%D8%A7%D9%84%D9%81%D8%A7%D8%AE%D8%B1"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 group"
        aria-label="التواصل عبر واتساب"
      >
        <div className="relative flex items-center gap-3 rounded-full pl-4 pr-5 py-3 bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all">
          <Phone className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">مساعدة فورية</span>
        </div>
      </a>
    </div>
  );
}
