'use client'

import ConfigurationCard from '@/components/ConfigurationCard'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import ProfileCard from '@/components/ProfileCard'
import MissionsSection from '@/components/MissionsSection'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="relative mt-8">
        <ConfigurationCard />
      </div>
    </main>
  )
}
