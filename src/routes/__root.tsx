import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { ClerkProvider } from '@clerk/tanstack-react-start'
import posthog from 'posthog-js'
import { useEffect } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'


// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_bXV0dWFsLXdoaXBwZXQtMTIuY2xlcmsuYWNjb3VudHMuZGV2JA'


if (typeof window !== 'undefined' && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
  })
}


import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Skill Maker',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const queryClient = router.options.context.queryClient

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <div className="flex h-screen w-full bg-background font-sans antialiased text-foreground overflow-hidden">
              <Sidebar />
              <div className="flex flex-col flex-1 overflow-y-auto">
                <header className="p-8 pb-0">
                  <div className="flex items-start gap-3">
                    <img src="/peacock_logo.jpg" alt="Logo" className="w-10 h-10 rounded-md shadow-sm object-cover" />
                    <div className="flex flex-col">
                      <span className="font-bold text-lg leading-tight tracking-tight text-foreground">Skill Maker</span>
                      <span className="text-sm italic text-muted-foreground font-serif">A workshop for AI skills</span>
                    </div>
                  </div>
                </header>
                <main className="flex-1">
                  {children}
                </main>
              </div>
            </div>
          </ClerkProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
