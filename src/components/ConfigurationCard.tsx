'use client'

import React, { useState } from 'react'

const ConfigurationCard = () => {
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState('')

  // Generate 30 avatar options (using numbers 1-30 as placeholders)
  const avatars = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 1}`
  }))

  return (
    <div className="w-full max-w-md mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg backdrop-blur-sm bg-opacity-90 border border-gray-100 relative">
      <div className="space-y-4">
        {/* Account Name */}
        <input
          type="text"
          id="accountName"
          placeholder="Account Name"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />

        {/* API Key */}
        <input
          type="password"
          id="apiKey"
          placeholder="API Key"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        />

        {/* Fetch Button */}
        <button
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Fetch
        </button>

        {/* Select Existing Player */}
        <div className="space-y-1">
          <select
            id="existingPlayer"
            className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Select Player</option>
          </select>
        </div>

        {/* Go Button */}
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
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
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-4"
          />

          {/* Player Name */}
          <input
            type="text"
            id="playerName"
            placeholder="Player Name"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 mb-4"
          />

          {/* Avatar Selection */}
          <button
            onClick={() => setShowAvatarModal(true)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:border-blue-500 transition-colors duration-200 text-gray-600 mb-4"
          >
            Select Player Avatar
          </button>

          {/* Add Button */}
          <button
            className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            Add
          </button>
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
    </div>
  )
}

export default ConfigurationCard
