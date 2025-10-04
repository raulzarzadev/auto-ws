import { Navbar } from '@/components/landing/navbar'
import { LandingMain } from '@/components/landing/landing-main'
import { LandingFooter } from '@/components/landing/footer'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[hsl(var(--background))]">
      <Navbar />
      <LandingMain />
      <LandingFooter />
    </div>
  )
}
