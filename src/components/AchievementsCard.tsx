'use client'

import React from 'react'

// Define the possible status values
type AchievementStatus = 'unlocked' | 'granted' | null

interface Achievement {
  id: string
  name: string
  description: string
  steps: number
  stepsCompleted: number
  status: AchievementStatus  // No longer allowing undefined
  imgUrl?: string
}

interface AchievementsCardProps {
  achievements: {
    id: string
    name: string
    description: string
    steps: number
    stepsCompleted: number
    status: 'unlocked' | 'granted' | null
    imgUrl?: string
  }[]
  isLoading?: boolean
  onEventCompleted?: () => void
}

// Helper function to get color based on status
const getProgressColor = (status: AchievementStatus): string => {
  switch (status) {
    case 'granted':
      return 'bg-green-500'
    case 'unlocked':
      return 'bg-blue-500'
    default:
      return 'bg-gray-300'
  }
}

const AchievementsCard: React.FC<AchievementsCardProps> = ({ achievements, isLoading = false, onEventCompleted }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mx-4" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-100/50 animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto" />
              <div className="mt-2 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!achievements.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 px-4">Achievements</h2>
        <div className="w-full p-4 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-100/50">
          <div className="text-sm text-gray-500 text-center py-4">
            No achievements available
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: AchievementStatus) => {
    switch (status) {
      case 'unlocked':
        return 'text-blue-600'
      case 'granted':
        return 'text-green-600'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: AchievementStatus) => {
    switch (status) {
      case 'unlocked':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'granted':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 px-4">Achievements</h2>
      <div className="grid grid-cols-3 gap-3">
        {achievements.map((achievement) => {
          const isActive = achievement.status !== null
          const progress = achievement.stepsCompleted || 0
          const progressPercent = Math.min(100, (progress / achievement.steps) * 100)

          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-xl shadow-lg border ${
                isActive 
                  ? 'bg-white/80 backdrop-blur-xl border-gray-100/50' 
                  : 'bg-gray-100/50 backdrop-blur-sm border-gray-200/50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className={`w-16 h-16 ${!isActive && 'opacity-50'}`}>
                  {achievement.imgUrl ? (
                    <img 
                      src={achievement.imgUrl} 
                      alt={achievement.name}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center w-full">
                  <h3 className={`text-sm font-medium line-clamp-2 ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {achievement.name}
                  </h3>
                  <div className="mt-1 space-y-1">
                    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(achievement.status)} transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <span className={`flex items-center gap-0.5 ${
                        isActive ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {progress}/{achievement.steps}
                      </span>
                      {isActive && (
                        <span className={`flex items-center gap-0.5 ${getStatusColor(achievement.status)}`}>
                          {getStatusIcon(achievement.status)}
                          {achievement.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AchievementsCard 