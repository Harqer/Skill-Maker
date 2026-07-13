import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ClerkProvider } from '@clerk/clerk-react'
import posthog from 'posthog-js'
import { useEffect } from 'react'
import { Header } from '@/components/layout/Header'
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
        title: 'TanStack Start Starter',
      },
    ],
    links: [
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
            <div className="flex min-h-screen flex-col bg-background font-sans antialiased">
              <Header />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </ClerkProvider>
        </QueryClientProvider>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
