import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

// Custom SVG Icons
const CheckIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

interface Streak {
  id: string
  name: string
  description?: string
  current: number
  target: number
  reward?: {
    points?: number
    credits?: number
  }
  eventId?: string
  missionId?: string
}

interface StreaksCardProps {
  playerId: string
  accountName: string
  apiKey: string
  onEventCompleted?: () => void
}

const StreaksCard: React.FC<StreaksCardProps> = ({ 
  playerId, 
  accountName, 
  apiKey,
  onEventCompleted 
}) => {
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState<Set<string>>(new Set())

  // Function to fetch mission details and extract event ID
  const getMissionEventId = async (missionId: string): Promise<string | undefined> => {
    try {
      const url = `https://api.gamelayer.co/api/v0/missions/${missionId}?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      const response = await fetch(url, { headers })
      if (!response.ok) {
        console.error('Failed to fetch mission details:', await response.text())
        return undefined
      }

      const data = await response.json()
      console.log('Mission details:', data)

      // Extract event ID from mission objectives
      const eventId = data.objectives?.events?.[0]?.id
      if (!eventId) {
        console.error('No event ID found in mission objectives:', data)
        return undefined
      }

      return eventId
    } catch (error) {
      console.error('Error fetching mission details:', error)
      return undefined
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch streaks
        const streaksUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/streaks?account=${encodeURIComponent(accountName)}`
        const headers = {
          'Accept': 'application/json',
          'api-key': apiKey
        }

        console.log('Fetching streaks with:', {
          playerId,
          accountName,
          streaksUrl
        })

        const streaksResponse = await fetch(streaksUrl, { headers })

        if (!streaksResponse.ok) {
          throw new Error(`Failed to fetch streaks: ${streaksResponse.statusText}`)
        }

        const streaksData = await streaksResponse.json()
        console.log('Parsed streaks data:', JSON.stringify(streaksData, null, 2))

        // Process started streaks
        const activeStreaks = await Promise.all(
          (streaksData.streaks?.started || []).map(async (streak: any) => {
            // Extract mission ID from objectives
            const missionId = streak.objectives?.[0]
            if (!missionId) {
              console.error('No mission ID found for streak:', streak)
              return null
            }

            // Get event ID from mission details
            const eventId = await getMissionEventId(missionId)
            if (!eventId) {
              console.error('Could not get event ID for mission:', missionId)
              return null
            }

            return {
              id: streak.id,
              name: streak.name,
              description: streak.description,
              current: streak.actions?.count || 0,  // Use actions.count for current progress
              target: streak.countLimit || 7,  // Use countLimit if available, default to 7
              reward: streak.reward,
              eventId,
              missionId
            }
          })
        )

        // Filter out any null streaks
        const validStreaks = activeStreaks.filter((streak): streak is Streak => streak !== null)
        setStreaks(validStreaks)

      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [playerId, accountName, apiKey])

  const handleComplete = async (streak: Streak) => {
    if (!streak.eventId) {
      console.error('No event ID found for streak:', streak.id)
      return
    }

    setIsCompleting(prev => new Set(prev).add(streak.id))

    try {
      const url = `https://api.gamelayer.co/api/v0/events/${streak.eventId}/complete`
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
      const body = {
        player: playerId,
        account: accountName
      }

      console.log('Completing event:', {
        eventId: streak.eventId,
        missionId: streak.missionId,
        streakId: streak.id
      })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        console.error('Failed to complete streak event:', await response.text())
        return
      }

      // Call the callback to refresh data
      if (onEventCompleted) {
        onEventCompleted()
      }
    } catch (error) {
      console.error('Error completing streak event:', error)
    } finally {
      setIsCompleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(streak.id)
        return newSet
      })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Current Streaks</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (streaks.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Current Streaks</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="text-sm text-gray-500 text-center py-4">
            No active streaks
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Current Streaks</h2>
      <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
        <div className="space-y-4">
          {streaks.map((streak) => (
            <div key={streak.id} className="space-y-2">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-900">{streak.name}</span>
                  <button
                    onClick={() => handleComplete(streak)}
                    disabled={!streak.eventId || isCompleting.has(streak.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                      isCompleting.has(streak.id)
                        ? 'bg-gray-100 text-gray-500 cursor-wait'
                        : streak.eventId
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isCompleting.has(streak.id) ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Completing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        Complete
                      </span>
                    )}
                  </button>
                </div>
                
                {/* Visual Progress Indicator */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: streak.target }).map((_, index) => {
                    const isCompleted = index < streak.current
                    const isCurrent = index === streak.current
                    
                    return (
                      <React.Fragment key={index}>
                        {/* Circle */}
                        <div
                          className={`w-3 h-3 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? 'bg-green-500'
                              : isCurrent
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-gray-200'
                          }`}
                        >
                          {isCompleted && (
                            <CheckIcon className="w-2 h-2 text-white" />
                          )}
                        </div>
                        
                        {/* Connector Line (except for last item) */}
                        {index < streak.target - 1 && (
                          <div 
                            className={`h-0.5 flex-1 ${
                              isCompleted ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>

                {/* Rewards */}
                {streak.reward && (
                  <div className="flex items-center gap-2 mt-1">
                    {streak.reward.points && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-medium text-yellow-700">
                          {streak.reward.points.toLocaleString()} points
                        </span>
                      </div>
                    )}
                    {streak.reward.credits && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.003-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.547.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-blue-700">
                          {streak.reward.credits.toLocaleString()} credits
                        </span>
                      </div>
                    )}
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

export default StreaksCard 