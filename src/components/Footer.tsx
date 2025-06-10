'use client'

import React from 'react'

const Footer = () => {
  return (
    <footer className="w-full py-6 mt-8 bg-white/80 backdrop-blur-xl border-t border-gray-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Left section - Logo and copyright */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">GL</span>
            </div>
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} GameLayer. All rights reserved.
            </div>
          </div>

          {/* Right section - Links */}
          <div className="flex items-center gap-6">
            <a 
              href="https://gamelayer.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              GameLayer
            </a>
            <a 
              href="https://gamelayer.co/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Documentation
            </a>
            <a 
              href="https://github.com/judgesteven/web-app" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer 