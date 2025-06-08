import ConfigurationCard from '@/components/ConfigurationCard'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="relative">
        <ConfigurationCard />
      </div>
    </main>
  )
}
