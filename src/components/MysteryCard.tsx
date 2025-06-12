import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Prize {
  id: string
  name: string
  description: string
  stock: number
  probability: number
  imgUrl?: string
  tags: string[]
}

interface MysteryBox {
  id: string
  name: string
  description: string
  imgUrl: string
  credits: number
  isAvailable: boolean
  stock: {
    redeemed: number
    available: number
    count: number
  }
  active: {
    from: string
    to: string
  }
  countLimit: number
  limitCount: boolean
  period: string
  requirement: {
    category: string
    tags: string[]
    missions: any[]
    achievements: any[]
    level: any
  }
  tags: string[]
}

interface MysteryCardProps {
  playerId: string
  accountName: string
  apiKey: string
  onEventCompleted?: () => void
}

const MysteryCard: React.FC<MysteryCardProps> = ({
  playerId,
  accountName,
  apiKey,
  onEventCompleted
}) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [credits, setCredits] = useState(0)
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null)
  const [wheelRotation, setWheelRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mysteryBox, setMysteryBox] = useState<MysteryBox | null>(null)

  // Add debug logging for spin button state
  useEffect(() => {
    console.log('Spin button state:', { 
      isSpinning, 
      isAvailable: mysteryBox?.isAvailable,
      mysteryBoxId: mysteryBox?.id,
      playerId,
      accountName
    })
  }, [isSpinning, mysteryBox, playerId, accountName])

  const fetchMysteryBox = async () => {
    try {
      const url = `https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      console.log('Fetching mystery box:', {
        url,
        headers: { ...headers, 'api-key': '***' },
        accountName,
        playerId
      })

      const response = await fetch(url, { headers })
      const text = await response.text()
      
      console.log('Mystery box response:', {
        status: response.status,
        statusText: response.statusText,
        body: text
      })

      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('Failed to parse mystery box response as JSON:', text)
        return
      }

      if (!response.ok) {
        console.error('Failed to fetch mystery box:', data)
        return
      }

      console.log('Setting mystery box data:', {
        id: data.id,
        isAvailable: data.isAvailable,
        credits: data.credits,
        stock: data.stock
      })

      setMysteryBox(data)
    } catch (error) {
      console.error('Error fetching mystery box:', error)
    }
  }

  useEffect(() => {
    const fetchMysteryBoxAndPrizes = async () => {
      try {
        // Fetch mystery box
        const mysteryBoxUrl = `https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel?account=${encodeURIComponent(accountName)}`
        const headers = {
          'Accept': 'application/json',
          'api-key': apiKey
        }

        console.log('Fetching mystery box:', {
          url: mysteryBoxUrl,
          headers: { ...headers, 'api-key': '***' }
        })

        const mysteryBoxResponse = await fetch(mysteryBoxUrl, { headers })
        const mysteryBoxText = await mysteryBoxResponse.text()
        
        console.log('Mystery box response:', {
          status: mysteryBoxResponse.status,
          statusText: mysteryBoxResponse.statusText,
          headers: Object.fromEntries(mysteryBoxResponse.headers.entries()),
          body: mysteryBoxText
        })

        if (!mysteryBoxResponse.ok) {
          throw new Error(`Failed to fetch mystery box: ${mysteryBoxResponse.statusText}`)
        }

        const mysteryBoxData = JSON.parse(mysteryBoxText)
        console.log('Mystery box data:', mysteryBoxData)

        // Check if mystery box is available
        if (!mysteryBoxData.isAvailable) {
          throw new Error('Mystery box is not available')
        }

        // Fetch prizes
        const prizesUrl = `https://api.gamelayer.co/api/v0/prizes?account=${encodeURIComponent(accountName)}`
        console.log('Fetching prizes:', {
          url: prizesUrl,
          headers: { ...headers, 'api-key': '***' }
        })

        const prizesResponse = await fetch(prizesUrl, { headers })
        const prizesText = await prizesResponse.text()
        
        console.log('Prizes response:', {
          status: prizesResponse.status,
          statusText: prizesResponse.statusText,
          headers: Object.fromEntries(prizesResponse.headers.entries()),
          body: prizesText
        })

        if (!prizesResponse.ok) {
          throw new Error(`Failed to fetch prizes: ${prizesResponse.statusText}`)
        }

        const prizesData = JSON.parse(prizesText)
        console.log('Prizes data:', prizesData)

        // Filter prizes with 'MB' tag and map to our Prize interface
        const mysteryPrizes = prizesData
          .filter((prize: any) => prize.tags?.includes('MB'))
          .map((prize: any) => ({
            id: prize.id,
            name: prize.name,
            description: prize.description,
            stock: prize.stock?.available || 0,
            probability: prize.probability || 0.25, // Default to equal probability if not specified
            imgUrl: prize.imgUrl,
            tags: prize.tags || []
          }))

        // If no prizes found, throw error
        if (mysteryPrizes.length === 0) {
          throw new Error('No mystery prizes available')
        }

        // Normalize probabilities to sum to 1
        const totalProbability = mysteryPrizes.reduce((sum: number, prize: Prize) => sum + prize.probability, 0)
        const normalizedPrizes = mysteryPrizes.map((prize: Prize) => ({
          ...prize,
          probability: prize.probability / totalProbability
        }))

        setMysteryBox(mysteryBoxData)
        setPrizes(normalizedPrizes)
        setCredits(mysteryBoxData.credits || 10)

      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load mystery wheel')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMysteryBoxAndPrizes()
  }, [accountName, apiKey])

  const handleSpin = async () => {
    if (!mysteryBox?.isAvailable) {
      toast.error('Mystery wheel is not available')
      return
    }

    if (isSpinning) {
      return
    }

    try {
      // Call the mystery box claim endpoint
      const claimUrl = `https://api.gamelayer.co/api/v0/mysteryboxes/1-test-wheel/claim`
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
      const body = {
        account: accountName,
        player: playerId
      }

      console.log('Claiming mystery box:', { url: claimUrl, headers: { ...headers, 'api-key': '***' }, body })

      const claimResponse = await fetch(claimUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      const claimText = await claimResponse.text()
      console.log('Mystery box claim response:', {
        status: claimResponse.status,
        statusText: claimResponse.statusText,
        body: claimText
      })

      let claimData
      try {
        claimData = JSON.parse(claimText)
      } catch (e) {
        console.error('Failed to parse claim response as JSON:', claimText)
        throw new Error('Invalid response from server')
      }

      if (!claimResponse.ok) {
        // Handle specific error codes
        if (claimData.code === 2) {
          // Don't spin, just show the API's error message
          toast.error(claimData.message || 'Not enough credits')
          return
        }
        throw new Error(claimData.message || 'Failed to claim mystery box')
      }

      // Only proceed with spinning if we got a successful response (code 1)
      if (claimData.code === 1) {
        setIsSpinning(true)

        // Start the wheel animation
        const spinDuration = 3000 // 3 seconds
        const startTime = Date.now()
        const startRotation = wheelRotation
        const targetRotation = startRotation + 1800 + Math.random() * 360 // 5 full rotations + random

        const animate = () => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / spinDuration, 1)
          
          // Easing function for smooth deceleration
          const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
          const currentRotation = startRotation + (targetRotation - startRotation) * easeOut(progress)
          
          setWheelRotation(currentRotation)

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            // Select prize based on final position
            const finalAngle = currentRotation % 360
            const prizeIndex = Math.floor((360 - finalAngle) / (360 / prizes.length))
            const prize = prizes[prizeIndex]
            
            setSelectedPrize(prize)
            
            // Update prize stock
            setPrizes(prev => prev.map(p => 
              p.id === prize.id ? { ...p, stock: p.stock - 1 } : p
            ))

            // Show prize notification
            toast.success(`You won: ${prize.name}`)

            // Call completion callback to refresh player data
            if (onEventCompleted) {
              onEventCompleted()
            }

            // Reset wheel after a short delay
            setTimeout(() => {
              setWheelRotation(0)
              setSelectedPrize(null)
              setIsSpinning(false)
            }, 2000) // Wait 2 seconds after winning to reset
          }
        }

        requestAnimationFrame(animate)
      } else {
        // Handle any other response codes
        toast.error(claimData.message || 'Failed to claim mystery box')
      }

    } catch (error) {
      console.error('Error in handleSpin:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to spin the wheel')
      setIsSpinning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Mystery Wheel</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="aspect-square bg-gray-200 rounded-full"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!mysteryBox || prizes.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">{mysteryBox?.name || 'Mystery Wheel'}</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="text-sm text-gray-500 text-center py-4">
            {prizes.length === 0 ? 'No mystery prizes available' : 'Mystery wheel is not available'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">{mysteryBox?.name}</h2>
      <div className="w-full p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
        <div className="space-y-6">
          {/* Header with Description and Credits */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600">{mysteryBox?.description}</p>
            <div className="flex justify-end">
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.003-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.547.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-blue-700">{mysteryBox?.credits} credits</span>
              </div>
            </div>
          </div>

          {/* Prize Wheel */}
          <div className="relative w-full aspect-square max-w-sm mx-auto">
            <div 
              className="absolute inset-0 rounded-full border-8 border-gray-200 bg-gradient-to-br from-purple-100 to-blue-100 transition-transform duration-3000 ease-out"
              style={{ transform: `rotate(${wheelRotation}deg)` }}
            >
              {/* Segment Dividers */}
              {prizes.map((_, index) => {
                const angle = (360 / prizes.length) * index
                return (
                  <div
                    key={`divider-${index}`}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1/2 bg-gray-300" />
                  </div>
                )
              })}

              {/* Prize Segments */}
              {prizes.map((prize, index) => {
                const angle = (360 / prizes.length) * index
                const segmentAngle = 360 / prizes.length
                const imageAngle = angle + (segmentAngle / 2) // Center the image in the segment
                return (
                  <div
                    key={prize.id}
                    className="absolute inset-0"
                    style={{
                      transform: `rotate(${imageAngle}deg)`,
                      transformOrigin: 'center'
                    }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 origin-bottom-right">
                      <div className="relative w-full h-full">
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                          {prize.imgUrl ? (
                            <img 
                              src={prize.imgUrl} 
                              alt={prize.name}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <span className="text-2xl">🎁</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {/* Center Point */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-4 border-gray-300 shadow-lg" />
            </div>
            
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 border-l-[12px] border-r-[12px] border-b-[24px] border-l-transparent border-r-transparent border-b-red-500" />
          </div>

          {/* Spin Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSpin}
              disabled={isSpinning || !mysteryBox?.isAvailable}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                isSpinning
                  ? 'bg-gray-100 text-gray-500 cursor-wait'
                  : mysteryBox?.isAvailable
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSpinning ? (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Spinning...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Spin
                </span>
              )}
            </button>
          </div>

          {/* Prize List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">Available Prizes</h3>
            <div className="grid gap-3">
              {prizes.map(prize => (
                <div
                  key={prize.id}
                  className={`bg-white rounded-xl p-4 border ${
                    prize.stock === 0 ? 'border-red-200 bg-red-50/50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {prize.imgUrl ? (
                        <img 
                          src={prize.imgUrl} 
                          alt={prize.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-2xl">🎁</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-medium text-gray-900">{prize.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          prize.stock === 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {prize.stock} left
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{prize.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MysteryCard 