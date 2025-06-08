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
    <div className="w-full max-w-md mx-auto p-0 sm:p-0 bg-gradient-to-br from-purple-500 via-teal-400 to-blue-400 rounded-3xl shadow-2xl border-0 relative overflow-hidden flex items-stretch min-h-[220px]">
      {/* Left: Avatar & Name */}
      <div className="flex flex-col items-center justify-center bg-white/90 rounded-l-3xl px-6 py-8 w-2/5 min-w-[140px]">
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-400 via-teal-300 to-blue-200 flex items-center justify-center shadow-lg border-4 border-white mb-3">
          {imgUrl ? (
            <img src={imgUrl} alt={name || 'Player avatar'} className="w-full h-full object-cover rounded-full" />
          ) : (
            <span className="text-5xl text-purple-300">👤</span>
          )}
        </div>
        <span className="mt-2 text-2xl font-bold text-gray-900 text-center tracking-wide" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>{name || 'Anonymous'}</span>
      </div>
      {/* Right: Stats */}
      <div className="flex flex-col justify-center flex-1 gap-4 px-6 py-8 bg-white/60 rounded-r-3xl">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Points</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-extrabold rounded-full px-4 py-1 text-base shadow">{points?.toLocaleString() || '-'}</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Credits</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-extrabold rounded-full px-4 py-1 text-base shadow">{credits?.toLocaleString() || '-'}</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Level</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-extrabold rounded-full px-4 py-1 text-base shadow">{level || '-'}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-gray-800" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif' }}>Team</span>
          <span className="ml-auto bg-gray-200 text-gray-900 font-extrabold rounded-full px-4 py-1 text-base shadow">{team || '-'}</span>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard 