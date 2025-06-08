'use client'

import React, { useState, useEffect } from 'react'
import ProfileCard from './ProfileCard'
import { toast } from 'react-hot-toast'

const ConfigurationCard = () => {
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')
  const [accountName, setAccountName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [players, setPlayers] = useState<{id?: string; name?: string; player?: string}[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('')
  const [playerData, setPlayerData] = useState<{
    name?: string;
    imgUrl?: string;
    points?: number;
    credits?: number;
    level?: { name: string };
    team?: string;
    teamId?: string;
  }>({})
  const [newPlayerId, setNewPlayerId] = useState('')
  const [newPlayerName, setNewPlayerName] = useState('')
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)

  // On mount, load apiKey from localStorage if present
  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey')
    if (storedKey) setApiKey(storedKey)
  }, [])

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
      toast.error('Please enter Account Name and API Key')
      return
    }

    setLoading(true)
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
        toast.error('Failed to fetch players: Invalid response from server')
        return
      }

      if (!response.ok) {
        if (data.message) {
          toast.error(data.message)
        } else {
          toast.error('Failed to fetch players')
        }
        return
      }

      setPlayers(data)
    } catch (error) {
      console.error('API Error:', error)
      toast.error('Failed to fetch players')
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamDetails = async (teamId: string) => {
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
  }

  const fetchPlayerDetails = async () => {
    if (!selectedPlayerId) return;
    const url = `https://api.gamelayer.co/api/v0/players/${selectedPlayerId}?account=${encodeURIComponent(accountName)}`;
    const headers = {
      'Accept': 'application/json',
      'api-key': apiKey,
    };
    console.log('API Request:', { method: 'GET', url, headers });
    try {
      const response = await fetch(url, { headers });
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error('API Error: Response is not valid JSON', text);
        return;
      }
      console.log('API Response:', data);
      
      // If player has a team ID, fetch team details
      if (data.team) {
        const teamName = await fetchTeamDetails(data.team);
        data.team = teamName;
      }
      
      setPlayerData(data);
    } catch (error) {
      console.error('API Error:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg backdrop-blur-sm bg-opacity-90 border border-gray-100 relative">
        <div className="space-y-4">
          {/* Account Name */}
          <input
            type="text"
            id="accountName"
            placeholder="Account Name"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />

          {/* API Key */}
          <input
            type="password"
            id="apiKey"
            placeholder="API Key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />

          {/* Fetch Button */}
          <button
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-60"
            onClick={fetchPlayers}
            disabled={loading || !accountName || !apiKey}
          >
            {loading ? 'Fetching...' : 'Fetch'}
          </button>

          {/* Select Existing Player */}
          <div className="space-y-1">
            <select
              id="existingPlayer"
              className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
            >
              <option value="">Select Player</option>
              {players.map((player, idx) => (
                <option key={player.player || idx} value={player.player}>
                  {player.name}
                </option>
              ))}
            </select>
          </div>

          {/* Go Button */}
          <button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
            onClick={fetchPlayerDetails}
            disabled={!selectedPlayerId}
          >
            Go
          </button>

          {/* Add New Player Section */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-base sm:text-lg font-semibold mb-4 text-gray-900">Add New Player</h3>
            
            {/* Player ID */}
            <input
              type="text"
              id="playerId"
              placeholder="Player ID"
              value={newPlayerId}
              onChange={e => setNewPlayerId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-4"
            />

            {/* Player Name */}
            <input
              type="text"
              id="playerName"
              placeholder="Player Name"
              value={newPlayerName}
              onChange={e => setNewPlayerName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-4"
            />

            {/* Avatar Selection */}
            <button
              onClick={() => setShowAvatarModal(true)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 transition-colors duration-200 text-gray-600 mb-4"
            >
              {selectedAvatar ? 'Change Avatar' : 'Select Player Avatar'}
            </button>

            {/* Add Button */}
            <button
              onClick={createNewPlayer}
              disabled={true}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Player
            </button>
          </div>
        </div>

        {/* Avatar Selection Modal */}
        {showAvatarModal && (
          <div className="absolute inset-0 bg-white rounded-xl shadow-xl z-10">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Select Avatar</h3>
                <button
                  onClick={() => setShowAvatarModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {avatars.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => {
                      setSelectedAvatar(avatar.url)
                      setShowAvatarModal(false)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <img
                      src={avatar.url}
                      alt={`Avatar ${avatar.id}`}
                      className="w-full h-auto rounded-lg"
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
    </div>
  )
}

export default ConfigurationCard
