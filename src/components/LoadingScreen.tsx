import React from 'react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evonto</h1>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen