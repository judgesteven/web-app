import React from 'react'

interface ProfileCardProps {
  name?: string;
  imgUrl?: string;
  points?: number;
  credits?: number;
  level?: string;
  team?: string;
}

const ProfileCard = ({ name, imgUrl, points, credits, level, team }: ProfileCardProps) => {
  return (
    <div className="w-full max-w-md mx-auto p-0 sm:p-0 bg-gradient-to-br from-purple-500 via-teal-400 to-blue-400 rounded-3xl shadow-2xl border-0 relative overflow-hidden flex items-stretch min-h-[200px]">
      {/* Left: Avatar & Name */}
      <div className="flex flex-col items-center justify-center bg-white/90 rounded-l-3xl px-4 py-6 w-2/5 min-w-[120px]">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-400 via-teal-300 to-blue-200 flex items-center justify-center shadow-lg border-4 border-white mb-2">
          {imgUrl ? (
            <img src={imgUrl} alt={name || 'Player avatar'} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-4xl text-purple-300">👤</span>
          )}
        </div>
        <span className="mt-1 text-lg font-bold text-gray-900 text-center tracking-wide" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>{name || 'Anonymous'}</span>
      </div>
      {/* Right: Stats */}
      <div className="flex flex-col justify-center flex-1 gap-3 px-4 py-6 bg-white/60 rounded-r-3xl">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Points</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-bold rounded-full px-3 py-0.5 text-sm shadow">{points?.toLocaleString() || '-'}</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Credits</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-bold rounded-full px-3 py-0.5 text-sm shadow">{credits?.toLocaleString() || '-'}</span>
        </div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-base font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Level</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-bold rounded-full px-3 py-0.5 text-sm shadow">{level || '-'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Team</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-bold rounded-full px-3 py-0.5 text-sm shadow">{team || '-'}</span>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard 