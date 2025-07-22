import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Smartphone, Monitor, Download, Share2, Eye, Calendar, Users, MapPin, Mail, Lock, Star, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { blink } from '@/blink/client'

interface Event {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  primary_color: string
  accent_color: string
  logo_url?: string
  organizer_id: string
}

interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description: string;
  speaker: string;
  startTime: string;
  endTime: string;
  location: string;
}

interface Attendee {
  id: string
  event_id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  job_title?: string
}

export default function AppPreview() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [sessions, setSessions] = useState<EventSession[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [currentView, setCurrentView] = useState<'welcome' | 'verify' | 'schedule' | 'attendees' | 'profile'>('welcome')
  const [verificationCode, setVerificationCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const loadEventData = async () => {
      if (!eventId) return

      try {
        const [eventData, sessionData, attendeeData] = await Promise.all([
          blink.db.events.list({ where: { id: eventId }, limit: 1 }),
          blink.db.eventSessions.list({ where: { event_id: eventId } }),
          blink.db.attendees.list({ where: { event_id: eventId } })
        ])

        if (eventData.length > 0) {
          setEvent(eventData[0])
        }
        setSessions(sessionData)
        setAttendees(attendeeData)
      } catch (error) {
        console.error('Error loading event data:', error)
        toast.error('Failed to load event data')
      } finally {
        setLoading(false)
      }
    }

    loadEventData()
  }, [eventId])

  const handleVerification = () => {
    if (verificationCode === '123456') {
      setIsAuthenticated(true)
      setCurrentView('schedule')
      toast.success('Successfully verified!')
    } else {
      toast.error('Invalid verification code. Try 123456 for demo.')
    }
  }

  const generateApp = async () => {
    if (!event) return

    try {
      toast.success('Mobile app generated successfully!')
      navigate(`/events/${eventId}/generated`)
    } catch (error) {
      console.error('Error generating app:', error)
      toast.error('Failed to generate app')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading app preview...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event not found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const MobileAppPreview = () => (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-black rounded-3xl p-2 shadow-2xl">
        <div className="bg-white rounded-2xl overflow-hidden h-[600px] relative">
          {/* Status Bar */}
          <div className="bg-black text-white text-xs px-4 py-1 flex justify-between items-center">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white rounded-sm"></div>
              <div className="w-1 h-2 bg-white rounded-sm"></div>
              <div className="w-6 h-2 bg-white rounded-sm"></div>
            </div>
          </div>

          {/* App Content */}
          <div className="h-full" style={{ backgroundColor: event.primary_color || '#6366F1' }}>
            {currentView === 'welcome' && (
              <div className="flex flex-col items-center justify-center h-full text-white p-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6">
                  <Calendar className="h-10 w-10" style={{ color: event.primary_color }} />
                </div>
                <h1 className="text-2xl font-bold text-center mb-4">{event.name}</h1>
                <p className="text-center text-white/90 mb-2">{formatDate(event.start_date)}</p>
                <p className="text-center text-white/90 mb-8 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </p>
                <div className="w-full space-y-4">
                  <Input
                    placeholder="Enter your email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70"
                  />
                  <Button
                    onClick={() => setCurrentView('verify')}
                    className="w-full bg-white text-black hover:bg-white/90"
                    disabled={!userEmail}
                  >
                    Get Access Code
                  </Button>
                </div>
              </div>
            )}

            {currentView === 'verify' && (
              <div className="flex flex-col items-center justify-center h-full text-white p-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
                  <Mail className="h-8 w-8" style={{ color: event.primary_color }} />
                </div>
                <h2 className="text-xl font-bold text-center mb-4">Check Your Email</h2>
                <p className="text-center text-white/90 mb-8">
                  We've sent a 6-digit code to {userEmail}
                </p>
                <div className="w-full space-y-4">
                  <Input
                    placeholder="Enter 6-digit code (try: 123456)"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/70 text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerification}
                    className="w-full bg-white text-black hover:bg-white/90"
                    disabled={verificationCode.length !== 6}
                  >
                    Verify & Continue
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setCurrentView('welcome')}
                    className="w-full text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {currentView === 'schedule' && isAuthenticated && (
              <div className="h-full bg-gray-50">
                {/* Header */}
                <div className="p-4 text-white" style={{ backgroundColor: event.primary_color }}>
                  <h2 className="text-lg font-bold">{event.name}</h2>
                  <p className="text-white/90 text-sm">{formatDate(event.start_date)}</p>
                </div>

                {/* Navigation */}
                <div className="flex bg-white border-b">
                  <button
                    onClick={() => setCurrentView('schedule')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      currentView === 'schedule' ? 'border-b-2 text-indigo-600' : 'text-gray-600'
                    }`}
                    style={{ borderColor: currentView === 'schedule' ? event.primary_color : 'transparent' }}
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => setCurrentView('attendees')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      currentView === 'attendees' ? 'border-b-2 text-indigo-600' : 'text-gray-600'
                    }`}
                    style={{ borderColor: currentView === 'attendees' ? event.primary_color : 'transparent' }}
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`flex-1 py-3 px-4 text-sm font-medium ${
                      currentView === 'profile' ? 'border-b-2 text-indigo-600' : 'text-gray-600'
                    }`}
                    style={{ borderColor: currentView === 'profile' ? event.primary_color : 'transparent' }}
                  >
                    Profile
                  </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-lg p-4 shadow-sm border">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{session.title}</h3>
                        <Star className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-gray-600 text-xs mb-2">{session.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(session.startTime)} - {formatTime(session.endTime)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Speaker: {session.speaker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'attendees' && isAuthenticated && (
              <div className="h-full bg-gray-50">
                {/* Header */}
                <div className="p-4 text-white" style={{ backgroundColor: event.primary_color }}>
                  <h2 className="text-lg font-bold">Attendees</h2>
                  <p className="text-white/90 text-sm">{attendees.length} people attending</p>
                </div>

                {/* Navigation */}
                <div className="flex bg-white border-b">
                  <button
                    onClick={() => setCurrentView('schedule')}
                    className="flex-1 py-3 px-4 text-sm font-medium text-gray-600"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => setCurrentView('attendees')}
                    className="flex-1 py-3 px-4 text-sm font-medium border-b-2 text-indigo-600"
                    style={{ borderColor: event.primary_color }}
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className="flex-1 py-3 px-4 text-sm font-medium text-gray-600"
                  >
                    Profile
                  </button>
                </div>

                {/* Attendees List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {attendees.slice(0, 10).map((attendee) => (
                    <div key={attendee.id} className="bg-white rounded-lg p-3 shadow-sm border flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs">
                          {attendee.first_name[0]}{attendee.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900">
                          {attendee.first_name} {attendee.last_name}
                        </p>
                        {attendee.company && (
                          <p className="text-xs text-gray-600">{attendee.company}</p>
                        )}
                        {attendee.job_title && (
                          <p className="text-xs text-gray-500">{attendee.job_title}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'profile' && isAuthenticated && (
              <div className="h-full bg-gray-50">
                {/* Header */}
                <div className="p-4 text-white" style={{ backgroundColor: event.primary_color }}>
                  <h2 className="text-lg font-bold">My Profile</h2>
                </div>

                {/* Navigation */}
                <div className="flex bg-white border-b">
                  <button
                    onClick={() => setCurrentView('schedule')}
                    className="flex-1 py-3 px-4 text-sm font-medium text-gray-600"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => setCurrentView('attendees')}
                    className="flex-1 py-3 px-4 text-sm font-medium text-gray-600"
                  >
                    Attendees
                  </button>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className="flex-1 py-3 px-4 text-sm font-medium border-b-2 text-indigo-600"
                    style={{ borderColor: event.primary_color }}
                  >
                    Profile
                  </button>
                </div>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm border text-center">
                    <Avatar className="h-20 w-20 mx-auto mb-4">
                      <AvatarFallback className="text-lg">
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-gray-900 mb-1">Demo User</h3>
                    <p className="text-sm text-gray-600 mb-4">{userEmail}</p>
                    <Button size="sm" variant="outline" className="mb-4">
                      Edit Profile
                    </Button>
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Event</span>
                        <span className="text-sm font-medium">{event.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-sm text-gray-600">Check-in Status</span>
                        <Badge variant="secondary" className="text-xs">Checked In</Badge>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-gray-600">Sessions Bookmarked</span>
                        <span className="text-sm font-medium">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">App Preview</h1>
              <p className="text-gray-600 mt-2">
                Preview your mobile app for {event.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(previewMode === 'mobile' ? 'desktop' : 'mobile')}
                className="flex items-center gap-2"
              >
                {previewMode === 'mobile' ? (
                  <>
                    <Monitor className="h-4 w-4" />
                    Desktop View
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Mobile View
                  </>
                )}
              </Button>
              <Button onClick={generateApp} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Generate App
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Controls */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview Controls
                </CardTitle>
                <CardDescription>
                  Navigate through different app screens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">App Screens</h4>
                  <div className="space-y-2">
                    <Button
                      variant={currentView === 'welcome' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentView('welcome')
                        setIsAuthenticated(false)
                      }}
                      className="w-full justify-start"
                    >
                      Welcome Screen
                    </Button>
                    <Button
                      variant={currentView === 'verify' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentView('verify')}
                      className="w-full justify-start"
                    >
                      Email Verification
                    </Button>
                    <Button
                      variant={currentView === 'schedule' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentView('schedule')
                        setIsAuthenticated(true)
                      }}
                      className="w-full justify-start"
                    >
                      Event Schedule
                    </Button>
                    <Button
                      variant={currentView === 'attendees' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentView('attendees')
                        setIsAuthenticated(true)
                      }}
                      className="w-full justify-start"
                    >
                      Attendee Directory
                    </Button>
                    <Button
                      variant={currentView === 'profile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentView('profile')
                        setIsAuthenticated(true)
                      }}
                      className="w-full justify-start"
                    >
                      User Profile
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Event Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions:</span>
                      <span className="font-medium">{sessions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendees:</span>
                      <span className="font-medium">{attendees.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Theme:</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: event.primary_color }}
                        ></div>
                        <span className="font-medium text-xs">{event.primary_color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mobile App Preview</CardTitle>
                <CardDescription>
                  Interactive preview of your conference mobile app
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <MobileAppPreview />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/attendees`)}
          >
            Back to Attendees
          </Button>
          <Button
            onClick={generateApp}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Generate Mobile App
          </Button>
        </div>
      </div>
    </div>
  )
}