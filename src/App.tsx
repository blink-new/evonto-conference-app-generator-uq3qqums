import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'

// Components
import Dashboard from './pages/Dashboard'
import EventSetup from './pages/EventSetup'
import AppConfiguration from './pages/AppConfiguration'
import AttendeeManagement from './pages/AttendeeManagement'
import AppPreview from './pages/AppPreview'
import GeneratedApp from './pages/GeneratedApp'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Evonto</h1>
            <p className="text-gray-600">Conference Mobile App Generator</p>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600">Sign in to create and manage your conference mobile apps</p>
            
            <button
              onClick={() => blink.auth.login()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Create branded mobile apps for your conferences and events
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/event/:eventId/setup" element={<EventSetup />} />
          <Route path="/event/:eventId/configure" element={<AppConfiguration />} />
          <Route path="/event/:eventId/attendees" element={<AttendeeManagement />} />
          <Route path="/event/:eventId/preview" element={<AppPreview />} />
          <Route path="/app/:eventId" element={<GeneratedApp />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App