import React, { useState, useEffect } from 'react'

interface LeaderboardEntry {
  rank: number
  player: {
    id: string
    name: string
    imgUrl?: string
  }
  points: number
  previousRank?: number
  previousPoints?: number
}

interface LeaderboardApiEntry {
  player: string
  name: string
  scores: number
  tags: string[]
  rank: number
}

interface PlayerDetails {
  id: string
  name: string
  imgUrl?: string
}

interface LeaderboardData {
  leaderboard: {
    description: string
    element: string
    id: string
    imgUrl: string
    name: string
    period: string
  }
  scores: {
    data: LeaderboardApiEntry[]
    totalPlayers: number
  }
}

interface LeaderboardCardProps {
  accountName: string
  apiKey: string
  onEventCompleted?: () => void
  selectedPlayerId?: string
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  accountName,
  apiKey,
  onEventCompleted,
  selectedPlayerId
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [previousEntries, setPreviousEntries] = useState<Record<string, { rank: number, points: number }>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [playerAvatars, setPlayerAvatars] = useState<Record<string, string>>({})
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({})

  // Fetch player details (avatar and name) - only called once per player
  const fetchPlayerDetails = async (playerId: string) => {
    try {
      const url = `https://api.gamelayer.co/api/v0/players/${playerId}?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      const response = await fetch(url, { headers })
      if (!response.ok) return null

      const data = await response.json()
      return {
        imgUrl: data.imgUrl,
        name: data.name
      }
    } catch (error) {
      console.error('Error fetching player details:', error)
      return null
    }
  }

  // Fetch all player details - only called once for initial load
  const fetchAllPlayerDetails = async (playerIds: string[]) => {
    const detailsPromises = playerIds.map(async (playerId) => {
      // Skip if we already have details for this player
      if (playerAvatars[playerId] && playerNames[playerId]) {
        return null
      }
      const details = await fetchPlayerDetails(playerId)
      if (!details) return null
      return [playerId, details] as const
    })

    const results = (await Promise.all(detailsPromises)).filter((result): result is [string, { imgUrl: string, name: string }] => 
      result !== null
    )

    const newAvatars: Record<string, string> = {}
    const newNames: Record<string, string> = {}

    results.forEach(([id, details]) => {
      if (details.imgUrl) newAvatars[id] = details.imgUrl
      if (details.name) newNames[id] = details.name
    })

    if (Object.keys(newAvatars).length > 0) {
      setPlayerAvatars(prev => ({ ...prev, ...newAvatars }))
    }
    if (Object.keys(newNames).length > 0) {
      setPlayerNames(prev => ({ ...prev, ...newNames }))
    }
  }

  // Fetch only leaderboard rankings and points
  const fetchLeaderboard = async () => {
    if (!accountName || !apiKey) {
      console.log('Leaderboard: Missing required props, skipping fetch')
      return
    }

    try {
      const url = `https://api.gamelayer.co/api/v0/leaderboards/1-test-leaderboard?account=${encodeURIComponent(accountName)}&_t=${Date.now()}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }

      const response = await fetch(url, { 
        headers,
        cache: 'no-store',
        method: 'GET'
      })

      if (!response.ok) {
        console.error('Leaderboard: API request failed', {
          status: response.status,
          statusText: response.statusText
        })
        return
      }

      const text = await response.text()
      
      let data: LeaderboardData
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('Leaderboard: Failed to parse response', {
          error: e,
          rawText: text
        })
        return
      }

      if (!data.scores?.data) {
        console.error('Leaderboard: Missing scores data', { data })
        return
      }

      // Transform the data to include rank and points, using cached names and avatars
      const leaderboardEntries = data.scores.data.map((entry: LeaderboardApiEntry) => {
        const previousEntry = previousEntries[entry.player]
        return {
          rank: entry.rank,
          player: {
            id: entry.player,
            name: playerNames[entry.player] || entry.name,
            imgUrl: playerAvatars[entry.player]
          },
          points: entry.scores,
          previousRank: previousEntry?.rank,
          previousPoints: previousEntry?.points
        }
      })

      // Update previous entries for next comparison
      const newPreviousEntries: Record<string, { rank: number, points: number }> = {}
      leaderboardEntries.forEach(entry => {
        newPreviousEntries[entry.player.id] = {
          rank: entry.rank,
          points: entry.points
        }
      })
      setPreviousEntries(newPreviousEntries)
      setEntries(leaderboardEntries)

      // Only fetch details for new players we haven't seen before
      const newPlayerIds = leaderboardEntries
        .filter(entry => !playerAvatars[entry.player.id] || !playerNames[entry.player.id])
        .map(entry => entry.player.id)
      
      if (newPlayerIds.length > 0) {
        console.log('Leaderboard: Fetching details for new players:', newPlayerIds)
        fetchAllPlayerDetails(newPlayerIds)
      }

    } catch (error) {
      console.error('Leaderboard: Fetch error', {
        error,
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Set up polling interval
  useEffect(() => {
    // Initial fetch
    fetchLeaderboard()

    // Set up polling interval
    const intervalId = setInterval(() => {
      console.log('Leaderboard: Polling for updates...')
      fetchLeaderboard()
    }, 10000) // Poll every 10 seconds

    // Cleanup interval on unmount
    return () => {
      console.log('Leaderboard: Cleaning up polling interval')
      clearInterval(intervalId)
    }
  }, [accountName, apiKey]) // Only re-run if account or API key changes

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Leaderboard</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Leaderboard</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="text-sm text-gray-500 text-center py-4">
            No leaderboard entries available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Leaderboard</h2>
      <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
        <div className="space-y-3">
          {entries.map((entry) => {
            const rankChanged = entry.previousRank !== undefined && entry.previousRank !== entry.rank
            const pointsChanged = entry.previousPoints !== undefined && entry.previousPoints !== entry.points
            const rankChange = entry.previousRank ? entry.previousRank - entry.rank : 0
            const pointsChange = entry.previousPoints ? entry.points - entry.previousPoints : 0

            return (
              <div 
                key={entry.player.id}
                className={`flex items-center gap-4 p-2 rounded-lg transition-colors ${
                  entry.player.id === selectedPlayerId
                    ? 'bg-blue-50/80 hover:bg-blue-100/80'
                    : 'hover:bg-gray-50/50'
                }`}
              >
                {/* Rank */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  entry.rank === 1 
                    ? 'bg-yellow-100 text-yellow-700'
                    : entry.rank === 2
                    ? 'bg-gray-100 text-gray-700'
                    : entry.rank === 3
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-50 text-gray-500'
                } ${rankChanged ? 'animate-pulse' : ''}`}>
                  {entry.rank}
                  {rankChanged && (
                    <span className={`absolute -top-1 -right-1 text-xs font-bold ${
                      rankChange > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {rankChange > 0 ? '↑' : '↓'}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden flex-shrink-0">
                  {playerAvatars[entry.player.id] ? (
                    <img 
                      src={playerAvatars[entry.player.id]} 
                      alt={entry.player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement?.classList.add('bg-gradient-to-br', 'from-purple-100', 'to-blue-100')
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {playerNames[entry.player.id] || entry.player.name}
                  </div>
                </div>

                {/* Points */}
                <div className={`flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full transition-colors ${
                  pointsChanged ? 'animate-pulse bg-blue-100' : ''
                }`}>
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">
                    {entry.points.toLocaleString()}
                  </span>
                  {pointsChanged && (
                    <span className={`text-xs font-bold ml-1 ${
                      pointsChange > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {pointsChange > 0 ? `+${pointsChange}` : pointsChange}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardCard 