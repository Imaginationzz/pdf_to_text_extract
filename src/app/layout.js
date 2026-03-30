import './globals.css';

export const metadata = {
  title: 'استخراج النصوص العربية | Arabic Text Extractor | MuslimWings',
  description: 'أفضل أداة لاستخراج النصوص العربية من ملفات PDF والصور (OCR) بدقة عالية. حول الصور إلى نصوص قابلة للتحرير وحفظها كملف Word أو TXT مجاناً.',
  keywords: ['استخراج النص من الصورة', 'تحويل PDF إلى Word عربي', 'OCR عربي', 'Arabic OCR', 'Extract Arabic text from image', 'PDF to Text Arabic', 'MuslimWings', 'أجنحة'],
  authors: [{ name: 'Yazid Rahmouni' }],
  creator: 'Yazid Rahmouni',
  publisher: 'MuslimWings',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AE',
    url: 'https://muslimwings.com', // Placeholder URL for now
    title: 'استخراج النصوص العربية | Arabic Text Extractor | MuslimWings',
    description: 'أفضل أداة لاستخراج النصوص العربية من ملفات PDF والصور (OCR) بدقة عالية. حول الصور إلى نصوص قابلة للتحرير وحفظها كملف Word.',
    siteName: 'MuslimWings أجنحة',
    images: [
      {
        url: '/logo.png', // Fallback image for social sharing
        width: 800,
        height: 600,
        alt: 'MuslimWings Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'استخراج النصوص العربية | Arabic Text Extractor',
    description: 'أفضل أداة لاستخراج النصوص العربية من ملفات PDF والصور (OCR) بدقة عالية.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
