export default function manifest() {
  return {
    name: 'مستخرج النصوص العربية',
    short_name: 'مستخرج النصوص',
    description: 'استخراج متقدم للنصوص العربية من الصور وملفات PDF بتقنية الذكاء الاصطناعي',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#8a2be2',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '192x192',
        type: 'image/x-icon',
      },
    ],
  }
}
