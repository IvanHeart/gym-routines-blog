export const siteConfig = {
  name: 'GymRoutines',
  description: 'Comparte y descubre las mejores rutinas de gimnasio',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ogImage: '/og-image.png',
  currency: {
    code: 'MXN',
    locale: 'es-MX',
  },
} as const
