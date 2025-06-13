'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface Prize {
  id: string
  name: string
  description: string
  imgUrl: string
  claimedAt: string
}

interface PlayerPrizesCardProps {
  accountName: string
  apiKey: string
  selectedPlayer: string
}

const PlayerPrizesCard: React.FC<PlayerPrizesCardProps> = ({
  accountName,
  apiKey,
  selectedPlayer
}) => {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrizes = async () => {
    if (!selectedPlayer) return

    try {
      const response = await fetch(
        `https://api.gamelayer.co/api/v0/players/${selectedPlayer}/prizes?account=${encodeURIComponent(accountName)}`,
        {
          headers: {
            'Accept': 'application/json',
            'api-key': apiKey,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      console.log('Player prizes response:', data)

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch prizes')
      }

      // Handle the response data structure
      const prizesArray = Array.isArray(data) ? data : 
                         data.prizes ? data.prizes :
                         data.items ? data.items : []
      
      setPrizes(prizesArray)
      setError(null)
    } catch (err) {
      console.error('Error fetching prizes:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch prizes')
      toast.error(err instanceof Error ? err.message : 'Failed to fetch prizes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedPlayer) {
      fetchPrizes()
    }
  }, [selectedPlayer, accountName, apiKey])

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto space-y-2">
        <h2 className="text-base font-semibold text-gray-800 px-2">Claimed Prizes</h2>
        <div className="px-2 py-1.5 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-white/20">
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!Array.isArray(prizes) || prizes.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-lg mx-auto space-y-2">
      <h2 className="text-base font-semibold text-gray-800 px-2">Claimed Prizes</h2>
      <div className="px-2 py-1.5 bg-white/80 backdrop-blur-xl rounded-xl shadow-sm border border-white/20">
        <div className="flex gap-2 overflow-x-auto">
          {prizes.map((prize) => (
            <div
              key={prize.id}
              className="flex-shrink-0 w-16 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="relative w-full aspect-square">
                {prize.imgUrl ? (
                  <Image
                    src={prize.imgUrl}
                    alt={prize.name}
                    fill
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🎁
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PlayerPrizesCard 