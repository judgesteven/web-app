'use client'

import React, { useState, useEffect, useCallback } from 'react'
import ProfileCard from './ProfileCard'
import MissionsSection from './MissionsSection'
import StreaksCard from './StreaksCard'
import AchievementsCard from './AchievementsCard'
import LeaderboardCard from './LeaderboardCard'
import SurveysCard from './SurveysCard'
import { toast } from 'react-hot-toast'

// Custom SVG components for chevron icons
const ChevronUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
)

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
)

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

interface Achievement {
  id: string
  name: string
  description: string
  steps: number
  stepsCompleted: number
  status: 'unlocked' | 'granted' | null
  imgUrl?: string
}

interface Player {
  id?: string
  name?: string
  player?: string
}

const ConfigurationCard = () => {
  // State declarations
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [newPlayerId, setNewPlayerId] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [accountName, setAccountName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState<string>('')
  const [playerData, setPlayerData] = useState<{
    name?: string;
    imgUrl?: string;
    points?: number;
    credits?: number;
    level?: { name: string };
    team?: string;
    teamId?: string;
  }>({})
  const [missions, setMissions] = useState<Mission[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [playerAchievements, setPlayerAchievements] = useState<Record<string, { status: 'unlocked' | 'granted'; stepsCompleted: number }>>({})
  const [lastEventTime, setLastEventTime] = useState(0)

  // Define all callback functions first
  const fetchTeamDetails = useCallback(async (teamId: string) => {
    const url = `https://api.gamelayer.co/api/v0/teams/${teamId}?account=${encodeURIComponent(accountName)}`;
    const headers = {
      'Accept': 'application/json',
      'api-key': apiKey,
    };
    console.log('Team API Request:', { method: 'GET', url, headers });
    try {
      const response = await fetch(url, { headers });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('Team API Error: Response is not valid JSON', text);
        return null;
      }
      console.log('Team API Full Response:', data);
      return data.team.name;
    } catch (error) {
      console.error('Team API Error:', error);
      return null;
    }
  }, [accountName, apiKey]);

  const fetchAchievementProgress = useCallback(async (playerId: string, currentAccountName: string, currentApiKey: string) => {
    const playerAchievementsUrl = `https://api.gamelayer.co/api/v0/players/${playerId}/achievements?account=${encodeURIComponent(currentAccountName)}`
    const headers = {
      'Accept': 'application/json',
      'api-key': currentApiKey
    }

    const playerAchievementsResponse = await fetch(playerAchievementsUrl, { headers })
    if (!playerAchievementsResponse.ok) {
      throw new Error('Failed to fetch player achievements')
    }
    const playerAchievementsData = await playerAchievementsResponse.json()
    console.log('Player achievements data:', playerAchievementsData)

    // Create a map of achievement status and progress
    const statusMap: Record<string, { status: 'unlocked' | 'granted', stepsCompleted: number }> = {}
    
    // Add completed achievements as 'granted' with full steps
    if (playerAchievementsData?.achievements?.completed) {
      playerAchievementsData.achievements.completed.forEach((achievement: any) => {
        statusMap[achievement.id] = {
          status: 'granted',
          stepsCompleted: achievement.steps || 0
        }
      })
    }
    
    // Add started achievements as 'unlocked' with their current steps
    if (playerAchievementsData?.achievements?.started) {
      playerAchievementsData.achievements.started.forEach((achievement: any) => {
        // Only set as unlocked if not already granted
        if (!statusMap[achievement.id]) {
          statusMap[achievement.id] = {
            status: 'unlocked',
            stepsCompleted: achievement.count || 0  // Use count field for progress
          }
        }
      })
    }

    return statusMap
  }, []) // No dependencies since we pass them as parameters

  const fetchPlayerDetails = useCallback(async () => {
    if (!selectedPlayer || !accountName || !apiKey) {
      console.log('Missing required fields for fetchPlayerDetails')
      return
    }

    try {
      const playerUrl = `https://api.gamelayer.co/api/v0/players/${selectedPlayer}?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      const playerResponse = await fetch(playerUrl, { headers })
      if (!playerResponse.ok) {
        throw new Error('Failed to fetch player details')
      }
      const playerData = await playerResponse.json()
      console.log('Player data:', playerData)

      // If player has a team ID, fetch team details
      let teamName = null
      if (playerData.team) {  // Changed from teamId to team since that's what we get from the API
        console.log('Fetching team details for team ID:', playerData.team)
        teamName = await fetchTeamDetails(playerData.team)
      }

      // Update player state with team name
      setPlayerData({
        ...playerData,
        team: teamName || playerData.team  // Use fetched team name if available, otherwise use original team value
      })
    } catch (error) {
      console.error('Error fetching player details:', error)
      toast.error('Failed to fetch player details')
    }
  }, [selectedPlayer, accountName, apiKey, fetchTeamDetails])

  const handleFetchAchievements = useCallback(async () => {
    if (!selectedPlayer || !accountName || !apiKey) return
    try {
      const statusMap = await fetchAchievementProgress(selectedPlayer, accountName, apiKey)
      setPlayerAchievements(prevAchievements => ({
        ...prevAchievements,
        ...statusMap
      }))
    } catch (error) {
      console.error('Error fetching achievement progress:', error)
    }
  }, [selectedPlayer, accountName, apiKey])

  const handleEventCompleted = useCallback(async () => {
    console.log('Event completed, refreshing achievement progress...')
    try {
      await fetchPlayerDetails()
      await handleFetchAchievements()
      setLastEventTime(Date.now())
    } catch (error) {
      console.error('Error refreshing data after event completion:', error)
    }
  }, [fetchPlayerDetails, handleFetchAchievements])

  // Define all useEffect hooks
  useEffect(() => {
    const storedAccountName = localStorage.getItem('accountName')
    const storedApiKey = localStorage.getItem('apiKey')
    
    if (storedAccountName) setAccountName(storedAccountName)
    if (storedApiKey) setApiKey(storedApiKey)
  }, [])

  useEffect(() => {
    if (accountName) localStorage.setItem('accountName', accountName)
    if (apiKey) localStorage.setItem('apiKey', apiKey)
  }, [accountName, apiKey])

  useEffect(() => {
    if (selectedPlayer) {
      console.log('Selected player changed, refreshing player data...')
      // Clear missions when player changes
      setMissions([])
      fetchPlayerDetails()
    }
  }, [selectedPlayer, fetchPlayerDetails])

  const handleGoClick = async () => {
    if (!selectedPlayer) return
    
    console.log('GO button clicked for player:', selectedPlayer)
    
    const headers = {
      'Accept': 'application/json',
      'api-key': apiKey
    }
    
    // Fetch missions first
    console.log('=== GET /missions API Response ===')
    try {
      const missionsUrl = `https://api.gamelayer.co/api/v0/missions?account=${encodeURIComponent(accountName)}`

      const missionsResponse = await fetch(missionsUrl, { headers })
      const missionsText = await missionsResponse.text()
      
      // Log the raw response exactly as received
      console.log('Raw missions response:', missionsText)

      if (!missionsResponse.ok) {
        console.error('Failed to fetch missions:', missionsText)
      } else {
        try {
          const missionsData = JSON.parse(missionsText)
          console.log('Parsed missions data:', missionsData)
          
          // The missions response is an array of mission objects
          if (Array.isArray(missionsData)) {
            setMissions(missionsData)
          } else {
            console.error('Unexpected missions data format:', missionsData)
          }
        } catch (e) {
          console.error('Failed to parse missions JSON:', e)
        }
      }

      // Fetch achievements
      console.log('=== GET /achievements API Response ===')
      const achievementsUrl = `https://api.gamelayer.co/api/v0/achievements?account=${encodeURIComponent(accountName)}`

      const achievementsResponse = await fetch(achievementsUrl, { headers })
      const achievementsText = await achievementsResponse.text()
      
      // Log the raw response exactly as received
      console.log('Raw achievements response:', achievementsText)

      if (!achievementsResponse.ok) {
        console.error('Failed to fetch achievements:', achievementsText)
      } else {
        try {
          const achievementsData = JSON.parse(achievementsText)
          console.log('Parsed achievements data:', achievementsData)
          
          // The achievements response is an array of achievement objects
          if (Array.isArray(achievementsData)) {
            setAchievements(achievementsData)
          } else {
            console.error('Unexpected achievements data format:', achievementsData)
          }
        } catch (e) {
          console.error('Failed to parse achievements JSON:', e)
        }
      }

      // Fetch player achievements
      await handleFetchAchievements()
      
      // Fetch player streaks
      console.log('Fetching player streaks...')
      const streaksData = await fetchPlayerStreaks(selectedPlayer)
      console.log('Player streaks data:', streaksData)
      
      // Then fetch player details
      await fetchPlayerDetails()
    } catch (error) {
      console.error('Error in handleGoClick:', error)
    }
  }

  const handleAccountNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccountName(e.target.value)
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
  }

  const handleStoreCredentials = () => {
    if (!accountName || !apiKey) {
      toast.error('Please enter both Account Name and API Key')
      return
    }

    localStorage.setItem('accountName', accountName)
    localStorage.setItem('apiKey', apiKey)
    toast.success('Credentials stored successfully!')
  }

  const handleSelectPlayer = (playerId: string | undefined) => {
    if (!playerId) return
    setSelectedPlayer(playerId)
    // Fetch missions when player is selected
    handleGoClick()
  }

  // Generate 30 avatar options (using numbers 1-30 as placeholders)
  const avatars = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`
  }))

  const checkPlayerExists = async (playerId: string) => {
    if (!accountName) {
      console.error('Account name is required')
      return false
    }

    const url = `https://api.gamelayer.co/api/v0/players/${playerId}?account=${encodeURIComponent(accountName.trim())}`
    const headers = {
      'Accept': 'application/json',
      'api-key': apiKey,
    }
    
    try {
      const response = await fetch(url, { headers })
      
      // 404 means player doesn't exist - this is a valid response
      if (response.status === 404) {
        console.log('Player does not exist:', playerId)
        return false
      }
      
      // If we get a 200, the player exists
      if (response.ok) {
        const text = await response.text()
        let data
        try {
          data = JSON.parse(text)
          console.log('Player exists:', data)
          return true
        } catch {
          console.error('API Error: Response is not valid JSON', text)
          return false
        }
      }
      
      // For any other status, log the error and return false
      const text = await response.text()
      console.error('Unexpected API response:', { status: response.status, text })
      return false
    } catch (error) {
      console.error('API Error:', error)
      return false
    }
  }

  const createNewPlayer = async () => {
    if (!newPlayerId || !newPlayerName || !selectedAvatar) {
      toast.error('Please fill in all fields and select an avatar')
      return
    }

    if (!accountName || !apiKey) {
      toast.error('Please enter Account Name and API Key')
      return
    }

    setIsAddingPlayer(true)
    try {
      // Create new player
      const url = `https://api.gamelayer.co/api/v0/players`
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      }

      // Create player with avatar
      const body = {
        player: newPlayerId,
        account: accountName.trim(),
        name: newPlayerName,
        imgUrl: selectedAvatar
      }

      console.log('Creating new player:', { 
        url, 
        headers: { ...headers, 'api-key': '***' }, // Hide API key in logs
        body 
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })

      const text = await response.text()
      console.log('Raw API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: text
      })
      
      // Handle 404 for account not found
      if (response.status === 404) {
        toast.error('Account not found. Please check your account name.')
        return
      }

      let data
      try {
        data = JSON.parse(text)
        console.log('Parsed API Response:', data)
      } catch {
        console.error('API Error: Response is not valid JSON', text)
        toast.error('Failed to create player: Invalid response from server')
        return
      }

      if (!response.ok) {
        if (data.message) {
          toast.error(data.message)
        } else {
          toast.error('Failed to create player')
        }
        return
      }

      toast.success('Player created successfully!')
      
      // Clear form
      setNewPlayerId('')
      setNewPlayerName('')
      setSelectedAvatar('')
      
      // Refresh players list
      fetchPlayers()
    } catch (error) {
      console.error('API Error:', error)
      toast.error('Failed to create player')
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const fetchPlayers = async () => {
    if (!accountName || !apiKey) {
      console.log('Missing credentials:', { accountName: !!accountName, apiKey: !!apiKey })
      toast.error('Please enter both Account Name and API Key')
      return
    }

    setIsLoading(true)
    console.log('Fetching players with account:', accountName)
    
    try {
      const url = `https://api.gamelayer.co/api/v0/players?account=${encodeURIComponent(accountName.trim())}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey,
      }

      console.log('Fetching players:', { 
        url, 
        headers: { ...headers, 'api-key': '***' } // Hide API key in logs
      })

      const response = await fetch(url, { headers })
      console.log('Players response status:', response.status)
      
      const text = await response.text()
      console.log('Raw players response:', text)
      
      // Handle 404 for account not found
      if (response.status === 404) {
        console.error('Account not found:', accountName)
        toast.error('Account not found. Please check your account name.')
        return
      }

      let data
      try {
        data = JSON.parse(text)
        console.log('Parsed players data:', data)
      } catch (e) {
        console.error('Failed to parse players JSON:', e)
        toast.error('Failed to parse players data')
        return
      }

      if (!response.ok) {
        console.error('Failed to fetch players:', data)
        if (data.message) {
          toast.error(data.message)
        } else {
          toast.error('Failed to fetch players')
        }
        return
      }

      setPlayers(data)
      console.log('Successfully set players:', data)
      toast.success('Players fetched successfully')
    } catch (error) {
      console.error('Error fetching players:', error)
      toast.error('Failed to fetch players')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlayerStreaks = async (playerId: string) => {
    try {
      const url = `https://api.gamelayer.co/api/v0/players/${playerId}/streaks?account=${encodeURIComponent(accountName)}`
      const headers = {
        'Accept': 'application/json',
        'api-key': apiKey
      }

      console.log('Fetching player streaks:', {
        url,
        headers: { ...headers, 'api-key': '***' }
      })

      const response = await fetch(url, { headers })
      const responseText = await response.text()
      
      console.log('Player streaks response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      })

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('Failed to parse streaks response as JSON:', responseText)
        return null
      }

      if (!response.ok) {
        console.error('Failed to fetch player streaks:', data)
        return null
      }

      console.log('Successfully fetched player streaks:', data)
      return data
    } catch (error) {
      console.error('Error fetching player streaks:', error)
      return null
    }
  }

  // Merge achievement data with player status and steps
  const achievementsWithStatus = achievements.map(achievement => {
    const playerAchievement = playerAchievements[achievement.id]
    // Ensure status is always defined by using null as default
    const status = playerAchievement?.status ?? null
    return {
      ...achievement,
      status,  // This will always be 'unlocked' | 'granted' | null
      stepsCompleted: playerAchievement?.stepsCompleted ?? 0,
      description: achievement.description || '',
      steps: achievement.steps || 0
    } as const
  }) as Array<{
    id: string
    name: string
    description: string
    steps: number
    stepsCompleted: number
    status: 'unlocked' | 'granted' | null  // Explicitly type the transformed data
    imgUrl?: string
  }>

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 relative">
        <div className="space-y-4">
          {/* Account Name */}
          <div className="flex gap-2">
            <input
              type="text"
              id="accountName"
              placeholder="Account Name"
              value={accountName}
              onChange={handleAccountNameChange}
              className="flex-1 px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 text-sm text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* API Key and Fetch Button */}
          <div className="flex gap-2">
            <input
              type="password"
              id="apiKey"
              placeholder="API Key"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="flex-1 px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 text-sm text-gray-800 placeholder-gray-400"
            />
            <button
              className="w-20 px-4 py-2 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-60 whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98] text-sm"
              onClick={fetchPlayers}
              disabled={isLoading || !accountName || !apiKey}
            >
              {isLoading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>

          {/* Select Existing Player and Go Button */}
          <div className="flex gap-2">
            <select
              id="existingPlayer"
              className="flex-1 px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 text-sm text-gray-800 appearance-none"
              value={selectedPlayer}
              onChange={e => setSelectedPlayer(e.target.value)}
            >
              <option value="">Select Player</option>
              {players.map((player, idx) => (
                <option key={player.player || idx} value={player.player}>
                  {player.name}
                </option>
              ))}
            </select>
            <button
              className="w-20 px-4 py-2 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 transition-all duration-200 disabled:opacity-60 whitespace-nowrap shadow-sm hover:shadow-md active:scale-[0.98] text-sm"
              onClick={handleGoClick}
              disabled={!selectedPlayer}
            >
              Go
            </button>
          </div>

          {/* Add New Player Section */}
          <div className="border-t border-gray-100/50 pt-4">
            <h3 className="text-sm font-semibold mb-3 text-gray-800">Add New Player</h3>
            
            {/* Player ID */}
            <input
              type="text"
              id="playerId"
              placeholder="Player ID"
              value={newPlayerId}
              onChange={e => setNewPlayerId(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 text-sm text-gray-800 placeholder-gray-400 mb-3"
            />

            {/* Player Name */}
            <input
              type="text"
              id="playerName"
              placeholder="Player Name"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              className="w-full px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all duration-200 text-sm text-gray-800 placeholder-gray-400 mb-3"
            />

            {/* Avatar Selection */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="w-full px-4 py-2 bg-white/50 border border-gray-200/50 rounded-3xl shadow-sm hover:border-blue-500/50 transition-all duration-200 text-sm text-gray-600 mb-3 hover:bg-white/70 active:scale-[0.98]"
            >
              {showAvatarModal ? (
                <ChevronUpIcon className="w-4 h-4 inline-block mr-2" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 inline-block mr-2" />
              )}
              {selectedAvatar ? 'Change Avatar' : 'Select Player Avatar'}
            </button>

            {/* Add Button */}
            <button
              onClick={createNewPlayer}
              disabled={true}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-3xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Player
            </button>
          </div>
        </div>

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl z-10">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Select Avatar</h3>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.url)
                      setShowAvatarModal(false)
                    }}
                    className="p-2 hover:bg-gray-100/50 rounded-2xl transition-all duration-200 active:scale-[0.98]"
                  >
                    <img
                      src={avatar.url}
                      alt={`Avatar ${avatar.id}`}
                      className="w-full h-auto rounded-xl"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <ProfileCard
        name={playerData.name}
        imgUrl={playerData.imgUrl}
        points={playerData.points}
        credits={playerData.credits}
        level={playerData.level?.name}
        team={playerData.team}
      />

      {/* Player Cards */}
      {selectedPlayer && (
        <>
          {/* Profile Card */}
          <div className="mb-6">
            <ProfileCard
              name={playerData.name}
              imgUrl={playerData.imgUrl}
              points={playerData.points}
              credits={playerData.credits}
              level={playerData.level?.name}
              team={playerData.team}
            />
          </div>

          {/* Surveys Card */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Surveys</h3>
            <SurveysCard
              accountName={accountName}
              apiKey={apiKey}
              playerId={selectedPlayer}
              onEventCompleted={handleEventCompleted}
            />
          </div>

          {/* Streaks Card */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Streaks</h3>
            <StreaksCard
              accountName={accountName}
              apiKey={apiKey}
              playerId={selectedPlayer}
              onEventCompleted={handleEventCompleted}
            />
          </div>

          {/* Achievements Card */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Achievements</h3>
            <AchievementsCard
              achievements={achievementsWithStatus}
              onEventCompleted={handleEventCompleted}
            />
          </div>

          {/* Leaderboard Card */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Leaderboard</h3>
            <LeaderboardCard
              accountName={accountName}
              apiKey={apiKey}
              onEventCompleted={handleEventCompleted}
              selectedPlayerId={selectedPlayer}
            />
          </div>
        </>
      )}

      {selectedPlayer && missions.length > 0 && (
        <MissionsSection 
          missions={missions} 
          playerId={selectedPlayer}
          accountName={accountName}
          apiKey={apiKey}
          onEventCompleted={handleEventCompleted}
        />
      )}
    </div>
  )
}

export default ConfigurationCard
