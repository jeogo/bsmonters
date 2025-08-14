import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          
          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-red-400">اتصل بنا</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span className="text-gray-300">776-863-561 213+</span>
              </div>
              
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span className="text-gray-300">info@watches-algeria.com</span>
              </div>
              
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="text-gray-300">الجزائر العاصمة، الجزائر</span>
              </div>
              
              <div className="pt-4">
                <a 
                  href="https://wa.me/213776863561"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.62-6.003C.122 5.281 5.403 0 12.057 0c3.182 0 6.167 1.24 8.41 3.482a11.79 11.79 0 013.49 8.401c-.003 6.654-5.284 11.936-11.938 11.936a11.95 11.95 0 01-6.003-1.621L.057 24zm6.597-3.807c1.735.995 3.27 1.591 5.392 1.593 5.448 0 9.886-4.434 9.889-9.885.003-5.462-4.415-9.89-9.881-9.894-5.45 0-9.887 4.434-9.89 9.884a9.83 9.83 0 001.662 5.513l-.999 3.648 3.827-.859zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.03-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.173.198-.297.298-.496.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
                  </svg>
                  راسلنا على واتساب
                </a>
              </div>
            </div>
          </div>

          {/* About Store Section */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-red-400">عن المتجر</h3>
            <div className="space-y-3">
              <Link href="#about" className="block text-gray-300 hover:text-white transition-colors">
                عن المتجر
              </Link>
              <Link href="#payment" className="block text-gray-300 hover:text-white transition-colors">
                طرق الدفع
              </Link>
              <Link href="#shipping" className="block text-gray-300 hover:text-white transition-colors">
                الشحن والتسليم
              </Link>
              <Link href="#warranty" className="block text-gray-300 hover:text-white transition-colors">
                الضمان والجودة
              </Link>
              <Link href="#faq" className="block text-gray-300 hover:text-white transition-colors">
                الأسئلة الشائعة
              </Link>
            </div>
          </div>

          {/* Terms & Policies Section */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-red-400">الشروط والسياسات</h3>
            <div className="space-y-3">
              <Link href="#terms" className="block text-gray-300 hover:text-white transition-colors">
                شروط الاستخدام
              </Link>
              <Link href="#returns" className="block text-gray-300 hover:text-white transition-colors">
                سياسة الاستبدال والإرجاع
              </Link>
              <Link href="#privacy" className="block text-gray-300 hover:text-white transition-colors">
                سياسة الخصوصية
              </Link>
              <Link href="#legal" className="block text-gray-300 hover:text-white transition-colors">
                الملاحظات القانونية
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="border-t border-gray-700 pt-8 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-sm">جودة مضمونة</h4>
              <p className="text-xs text-gray-400">ضمان شامل</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 8l7.89 1.26a2 2 0 001.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-sm">دفع آمن</h4>
              <p className="text-xs text-gray-400">عند الاستلام</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 16l-4-4m0 0l4-4m-4 4h16"/>
                </svg>
              </div>
              <h4 className="font-semibold text-sm">إرجاع سهل</h4>
              <p className="text-xs text-gray-400">خلال 7 أيام</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-sm">توصيل سريع</h4>
              <p className="text-xs text-gray-400">خلال 24-48 ساعة</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} متجر الساعات الفاخرة. جميع الحقوق محفوظة.</p>
          <p className="mt-2">صُنع بـ ❤️ في الجزائر</p>
        </div>
      </div>
    </footer>
  );
}
