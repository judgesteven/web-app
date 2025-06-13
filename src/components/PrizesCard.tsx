'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'

interface Prize {
  id: string
  name: string
  description: string
  imgUrl: string
  tags: string[]
  stock: {
    available: number
    redeemed: number
    count: number
  }
}

interface PrizesCardProps {
  accountName: string
  apiKey: string
  onEventCompleted?: () => void
}

const PrizesCard: React.FC<PrizesCardProps> = ({ accountName, apiKey, onEventCompleted }) => {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        setIsLoading(true)
        const url = `https://api.gamelayer.co/api/v0/prizes?account=${encodeURIComponent(accountName)}`
        const headers = {
          'Accept': 'application/json',
          'api-key': apiKey
        }

        console.log('Fetching prizes:', {
          url,
          headers: { ...headers, 'api-key': '***' }
        })

        const response = await fetch(url, { headers })
        const responseText = await response.text()
        
        console.log('Prizes response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseText
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch prizes: ${response.statusText}`)
        }

        let data
        try {
          data = JSON.parse(responseText)
        } catch (e) {
          console.error('Failed to parse prizes response as JSON:', responseText)
          throw new Error('Failed to parse prizes data')
        }

        // Filter prizes to only show those with 'MB' tag
        const filteredPrizes = (data || []).filter((prize: Prize) => 
          prize.tags && prize.tags.includes('MB')
        )
        setPrizes(filteredPrizes)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load prizes')
        console.error('Error fetching prizes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (accountName && apiKey) {
      fetchPrizes()
    }
  }, [accountName, apiKey])

  if (prizes.length === 0 && !isLoading && !error) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Available Prizes</h2>
      <div className="p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : (
          <div className="space-y-3">
            {prizes.map((prize) => (
              <div 
                key={prize.id} 
                className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-md border border-gray-100/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <Image
                      src={prize.imgUrl}
                      alt={prize.name}
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="text-base font-semibold text-gray-800 truncate">{prize.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{prize.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="flex items-center">
                          <CheckCircleIcon className="h-3.5 w-3.5 mr-1" />
                          <span>Available</span>
                        </span>
                        <span className="font-semibold ml-1">{prize.stock.available}</span>
                      </div>
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="flex items-center">
                          <XCircleIcon className="h-3.5 w-3.5 mr-1" />
                          <span>Claimed</span>
                        </span>
                        <span className="font-semibold ml-1">{prize.stock.redeemed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PrizesCard 