This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Подключение домена GoDaddy к Vercel

### Способ 1: Использование DNS записей (рекомендуется)

1. **В панели Vercel:**
   - Перейдите в настройки проекта (Settings → Domains)
   - Добавьте ваш домен (например, `example.com` и `www.example.com`)
   - Vercel покажет вам DNS записи, которые нужно добавить

2. **В панели GoDaddy:**
   - Войдите в аккаунт GoDaddy
   - Перейдите в "Мои продукты" → "DNS" или "Управление DNS"
   - Найдите ваш домен и откройте настройки DNS

3. **Добавьте DNS записи:**
   
   Для корневого домена (example.com):
   - Тип: `A`
   - Имя: `@` (или оставьте пустым)
   - Значение: IP адрес от Vercel (обычно `76.76.21.21`)
   - TTL: `600` (или оставьте по умолчанию)
   
   Для поддомена www (www.example.com):
   - Тип: `CNAME`
   - Имя: `www`
   - Значение: `cname.vercel-dns.com.` (или значение, указанное Vercel)
   - TTL: `600`

4. **Ожидание распространения DNS:**
   - Изменения DNS могут занять от нескольких минут до 48 часов
   - Обычно это занимает 1-2 часа

### Способ 2: Использование Nameservers Vercel (альтернативный)

1. **В панели Vercel:**
   - Перейдите в Settings → Domains
   - Добавьте домен
   - Выберите опцию "Use Vercel Nameservers"
   - Скопируйте nameservers (например, `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)

2. **В панели GoDaddy:**
   - Перейдите в "Мои продукты" → "DNS"
   - Найдите ваш домен
   - Измените Nameservers на те, что предоставил Vercel
   - Сохраните изменения

3. **Ожидание:**
   - Изменение nameservers может занять до 48 часов

### Проверка подключения

После настройки DNS:
- Vercel автоматически проверит подключение домена
- В панели Vercel статус домена должен измениться на "Valid"
- SSL сертификат будет автоматически выдан Vercel

### Полезные ссылки

- [Документация Vercel по доменам](https://vercel.com/docs/concepts/projects/domains)
- [Инструкции GoDaddy по управлению DNS](https://www.godaddy.com/help/manage-dns-records-680)
