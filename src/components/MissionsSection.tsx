import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface Mission {
  id: string
  name: string
  imgUrl?: string
  description: string
  category?: string
  objectives?: {
    quizzId: string
    surveyId: string
    events: Array<{ id: string }>
    missions: Array<any>
  }
  reward?: {
    points?: number
    credits?: number
    achievements?: Array<any>
  }
  active?: {
    from?: string
    to?: string
  }
  priority?: number
  completed?: boolean
  isAvailable: boolean
  period?: string
  countLimit?: number
  limitCount?: boolean
  timeToComplete?: number
  timeToRestart?: number
}

interface MissionsSectionProps {
  missions: Mission[]
  playerId: string
  accountName: string
  apiKey: string
  onEventCompleted?: () => void
}

const MissionsSection: React.FC<MissionsSectionProps> = ({ 
  missions, 
  playerId, 
  accountName,
  apiKey,
  onEventCompleted 
}) => {
  const [visibleCount, setVisibleCount] = useState(3)
  const [isCompleting, setIsCompleting] = useState<Set<string>>(new Set())
  
  // Add logging when missions prop changes
  useEffect(() => {
    console.log('Missions data received:', missions)
    missions.forEach(mission => {
      console.log('Mission details:', {
        id: mission.id,
        name: mission.name,
        objectives: mission.objectives,
        hasEventId: !!mission.objectives?.events?.[0]?.id,
        rawObjectives: JSON.stringify(mission.objectives, null, 2),
        category: mission.category,
        isAvailable: mission.isAvailable
      })
    })
  }, [missions])
  
  // Filter and sort missions by priority
  const filteredAndSortedMissions = [...missions]
    .sort((a, b) => {
      // Handle undefined/null priorities
      const priorityA = a.priority ?? 0
      const priorityB = b.priority ?? 0
      
      // If both priorities are 0, maintain original order
      if (priorityA === 0 && priorityB === 0) return 0
      
      // If only one priority is 0, put it last
      if (priorityA === 0) return 1
      if (priorityB === 0) return -1
      
      // Sort by priority (lower number = higher priority)
      // So priority 1 comes before priority 2
      return priorityA - priorityB
    })
  
  console.log('Sorted missions by priority:', filteredAndSortedMissions.map(m => ({
    id: m.id,
    name: m.name,
    priority: m.priority,
    category: m.category
  })))
  
  const visibleMissions = filteredAndSortedMissions.slice(0, visibleCount)
  const hasMore = visibleCount < filteredAndSortedMissions.length
  const canReduce = visibleCount > 3

  const getEventDetails = async (eventId: string) => {
    try {
      const url = `https://api.gamelayer.co/api/v0/events/${eventId}?account=${encodeURIComponent(accountName)}&player=${encodeURIComponent(playerId)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      console.log('Fetching event details:', {
        url,
        headers: { ...headers, 'api-key': '***' }
      })

      const response = await fetch(url, { headers })
      const responseText = await response.text()
      
      console.log('Event details response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse event details response as JSON:', responseText)
        return null
      }

      if (!response.ok) {
        console.error('Failed to fetch event details:', data)
        return null
      }

      console.log('Successfully fetched event details:', data)
      return data
    } catch (error) {
      console.error('Error fetching event details:', error)
      return null
    }
  }

  const handleComplete = async (mission: Mission) => {
    console.log('Complete button clicked for mission:', mission)
    console.log('Mission objectives:', JSON.stringify(mission.objectives, null, 2))
    
    // Get the first event ID from the events array in objectives
    const eventId = mission.objectives?.events?.[0]?.id
    if (!eventId) {
      console.error('No event ID found in mission objectives:', mission.objectives)
      toast.error('This mission cannot be completed yet')
      return
    }

    console.log('Found event ID:', eventId)
    setIsCompleting(prev => new Set(prev).add(mission.id))

    try {
      // Now proceed with completion
      const url = `https://api.gamelayer.co/api/v0/events/${eventId}/complete`
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
      const body = {
        player: playerId,
        account: accountName
      }

      console.log('Attempting to complete event:', {
        url,
        headers: { ...headers, 'api-key': '***' },
        body
      })

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      const responseText = await response.text()
      console.log('Event completion response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse completion response as JSON:', responseText)
        toast.error('Failed to complete mission')
        return
      }

      if (!response.ok) {
        console.error('Failed to complete event:', data)
        toast.error(data.message || 'Failed to complete mission')
        return
      }

      console.log('Successfully completed event:', data)
      
      // Call the callback to refresh player data
      if (onEventCompleted) {
        console.log('Triggering player data refresh...')
        onEventCompleted()
      }
    } catch (error) {
      console.error('Error completing event:', error)
      toast.error('Failed to complete mission')
    } finally {
      setIsCompleting(prev => {
        const newSet = new Set(prev)
        newSet.delete(mission.id)
        return newSet
      })
    }
  }

  const expand = () => {
    setVisibleCount(prev => prev + 3)
  }

  const reduce = () => {
    setVisibleCount(3)
  }

  const formatTimeRemaining = (to: string) => {
    const end = new Date(to)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (!missions || missions.length === 0) {
    return null
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Available Missions</h2>
      <div className="space-y-4">
        {visibleMissions.map((mission) => {
          const isCompletingMission = isCompleting.has(mission.id)
          const eventId = mission.objectives?.events?.[0]?.id
          const isHidden = mission.category === 'Hidden'
          const canComplete = !!eventId && !mission.completed && mission.isAvailable

          return (
            <div 
              key={mission.id} 
              className={`bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-100/50 hover:shadow-xl transition-all duration-200 ${
                isCompletingMission ? 'opacity-75' : ''
              } ${isHidden ? 'border-purple-200 bg-purple-50/50' : ''} ${
                mission.completed ? 'border-green-200 bg-green-50/50' : ''
              }`}
            >
              <div className="flex gap-4">
                {/* Mission Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {mission.imgUrl ? (
                    <img 
                      src={mission.imgUrl} 
                      alt={mission.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
                      <span className="text-2xl">🎯</span>
                    </div>
                  )}
                </div>

                {/* Mission Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{mission.name}</h3>
                      {isHidden && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Hidden
                        </span>
                      )}
                      {mission.completed && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Button clicked for mission:', mission.id)
                        handleComplete(mission)
                      }}
                      disabled={isCompletingMission || !canComplete}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        isCompletingMission
                          ? 'bg-gray-100 text-gray-500 cursor-wait'
                          : canComplete
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isCompletingMission ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Completing...
                        </span>
                      ) : mission.completed ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Complete
                        </span>
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{mission.description}</p>
                  
                  {/* Rewards and Time Remaining */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(mission.reward?.points !== undefined && mission.reward.points !== null) && (
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-medium text-yellow-700">
                          {(mission.reward.points ?? 0).toLocaleString()} points
                        </span>
                      </div>
                    )}
                    
                    {(mission.reward?.credits !== undefined && mission.reward.credits !== null) && (
                      <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1.003-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.547.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium text-blue-700">
                          {(mission.reward.credits ?? 0).toLocaleString()} credits
                        </span>
                      </div>
                    )}

                    {mission.active?.to && (
                      <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-700">
                          {formatTimeRemaining(mission.active.to)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Expand/Reduce Buttons */}
      <div className="flex justify-center gap-2 px-4">
        {hasMore && (
          <button
            onClick={expand}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
          >
            Show More
          </button>
        )}
        {canReduce && (
          <button
            onClick={reduce}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
          >
            Show Less
          </button>
        )}
      </div>
    </div>
  )
}

export default MissionsSection 