import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, MapPin, Clock, Calendar, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { blink } from '@/blink/client'
import { toast } from '@/hooks/use-toast'
import { validateSession, validateVenue, ValidationError } from '@/utils/validation'

interface Session {
  id?: string
  title: string
  description: string
  speaker: string
  start_time: string
  end_time: string
  venue: string
  date: string
}

interface Event {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  primary_color: string
  accent_color: string
  venue_name: string
  venue_address: string
  venue_maps_link: string
  organizer_name: string
  organizer_email: string
  organizer_phone: string
  organization_name: string
}

export default function AppConfiguration() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessionErrors, setSessionErrors] = useState<Record<string, string>>({})
  const [venueErrors, setVenueErrors] = useState<Record<string, string>>({})

  // New session form state
  const [newSession, setNewSession] = useState<Session>({
    title: '',
    description: '',
    speaker: '',
    start_time: '',
    end_time: '',
    venue: '',
    date: ''
  })

  const loadEventAndSessions = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load event details
      const eventData = await blink.db.events.list({
        where: { id: eventId },
        limit: 1
      })
      
      if (eventData.length === 0) {
        toast({
          title: "Event not found",
          description: "The event you're looking for doesn't exist.",
          variant: "destructive"
        })
        navigate('/dashboard')
        return
      }
      
      setEvent(eventData[0] as Event)
      
      // Load existing sessions
      const sessionsData = await blink.db.eventSessions.list({
        where: { eventId: eventId },
        orderBy: { date: 'asc', startTime: 'asc' }
      })
      
      setSessions(sessionsData as Session[])
      
      // Set default date for new sessions
      if (eventData[0].start_date) {
        setNewSession(prev => ({ ...prev, date: eventData[0].start_date }))
      }
      
    } catch (error) {
      console.error('Error loading event and sessions:', error)
      toast({
        title: "Error",
        description: "Failed to load event details.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [eventId, navigate])

  useEffect(() => {
    loadEventAndSessions()
  }, [eventId, loadEventAndSessions])

  const addSession = async () => {
    // Validate session before adding
    const validation = validateSession(newSession, event?.start_date, event?.end_date)
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
      setSessionErrors(newErrors)
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the session form.",
        variant: "destructive"
      })
      return
    }

    // Clear any existing errors
    setSessionErrors({})

    try {
      setSaving(true)
      
      const sessionData = {
        ...newSession,
        eventId: eventId,
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      await blink.db.eventSessions.create(sessionData)
      
      setSessions(prev => [...prev, sessionData as Session])
      
      // Reset form
      setNewSession({
        title: '',
        description: '',
        speaker: '',
        start_time: '',
        end_time: '',
        venue: '',
        date: event?.start_date || ''
      })
      
      toast({
        title: "Session added",
        description: "The session has been added to your event schedule."
      })
      
    } catch (error) {
      console.error('Error adding session:', error)
      toast({
        title: "Error",
        description: "Failed to add session. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const removeSession = async (sessionId: string) => {
    try {
      await blink.db.eventSessions.delete(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      toast({
        title: "Session removed",
        description: "The session has been removed from your event schedule."
      })
    } catch (error) {
      console.error('Error removing session:', error)
      toast({
        title: "Error",
        description: "Failed to remove session. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateVenueDetails = async (venueData: Partial<Event>) => {
    if (!event) return

    // Validate venue data
    const validation = validateVenue(venueData)
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
      setVenueErrors(newErrors)
      
      toast({
        title: "Validation Error",
        description: "Please fix the venue information errors.",
        variant: "destructive"
      })
      return
    }

    // Clear any existing errors
    setVenueErrors({})

    try {
      setSaving(true)
      
      await blink.db.events.update(event.id, venueData)
      
      setEvent(prev => prev ? { ...prev, ...venueData } : null)
      
      toast({
        title: "Venue updated",
        description: "Venue details have been saved successfully."
      })
      
    } catch (error) {
      console.error('Error updating venue:', error)
      toast({
        title: "Error",
        description: "Failed to update venue details.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Helper component for field errors
  const FieldError = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <p className="text-sm text-red-600 mt-1 flex items-center">
        <AlertCircle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event configuration...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Event not found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{event.name}</h1>
                <p className="text-sm text-gray-500">Configure your event app</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => navigate(`/events/${eventId}/attendees`)}
                variant="outline"
              >
                Manage Attendees
              </Button>
              <Button
                onClick={() => navigate(`/events/${eventId}/preview`)}
                style={{ backgroundColor: event.primary_color }}
                className="text-white hover:opacity-90"
              >
                Preview App
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Session Management */}
          <div className="space-y-6">
            {/* Add New Session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add Session</span>
                </CardTitle>
                <CardDescription>
                  Create a new session for your event schedule
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="session-title">Session Title *</Label>
                    <Input
                      id="session-title"
                      value={newSession.title}
                      onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Opening Keynote"
                      className={sessionErrors.title ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    <FieldError error={sessionErrors.title} />
                  </div>
                  <div>
                    <Label htmlFor="session-speaker">Speaker</Label>
                    <Input
                      id="session-speaker"
                      value={newSession.speaker}
                      onChange={(e) => setNewSession(prev => ({ ...prev, speaker: e.target.value }))}
                      placeholder="e.g., John Smith"
                      className={sessionErrors.speaker ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    <FieldError error={sessionErrors.speaker} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="session-description">Description</Label>
                  <Textarea
                    id="session-description"
                    value={newSession.description}
                    onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the session..."
                    rows={2}
                    className={sessionErrors.description ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={sessionErrors.description} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="session-date">Date *</Label>
                    <Input
                      id="session-date"
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                      min={event.start_date}
                      max={event.end_date}
                      className={sessionErrors.date ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    <FieldError error={sessionErrors.date} />
                  </div>
                  <div>
                    <Label htmlFor="session-start">Start Time *</Label>
                    <Input
                      id="session-start"
                      type="time"
                      value={newSession.start_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                      className={sessionErrors.start_time ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    <FieldError error={sessionErrors.start_time} />
                  </div>
                  <div>
                    <Label htmlFor="session-end">End Time *</Label>
                    <Input
                      id="session-end"
                      type="time"
                      value={newSession.end_time}
                      onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                      className={sessionErrors.end_time ? 'border-red-500 focus:border-red-500' : ''}
                    />
                    <FieldError error={sessionErrors.end_time} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="session-venue">Venue/Room</Label>
                  <Input
                    id="session-venue"
                    value={newSession.venue}
                    onChange={(e) => setNewSession(prev => ({ ...prev, venue: e.target.value }))}
                    placeholder="e.g., Main Auditorium, Room A"
                    className={sessionErrors.venue ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={sessionErrors.venue} />
                </div>

                <Button
                  onClick={addSession}
                  disabled={saving}
                  className="w-full"
                  style={{ backgroundColor: event.primary_color }}
                >
                  {saving ? 'Adding...' : 'Add Session'}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Event Schedule</span>
                  <Badge variant="secondary">{sessions.length} sessions</Badge>
                </CardTitle>
                <CardDescription>
                  Manage your event sessions and schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No sessions added yet</p>
                    <p className="text-sm">Add your first session above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{session.title}</h4>
                            {session.speaker && (
                              <p className="text-sm text-gray-600 mt-1">by {session.speaker}</p>
                            )}
                            {session.description && (
                              <p className="text-sm text-gray-500 mt-2">{session.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(session.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{session.start_time} - {session.end_time}</span>
                              </div>
                              {session.venue && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{session.venue}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => session.id && removeSession(session.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Venue Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Venue Details</span>
                </CardTitle>
                <CardDescription>
                  Configure venue information and location details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="venue-name">Venue Name</Label>
                  <Input
                    id="venue-name"
                    value={event.venue_name || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, venue_name: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ venue_name: e.target.value })}
                    placeholder="e.g., Convention Center"
                  />
                </div>

                <div>
                  <Label htmlFor="venue-address">Venue Address</Label>
                  <Textarea
                    id="venue-address"
                    value={event.venue_address || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, venue_address: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ venue_address: e.target.value })}
                    placeholder="Full address of the venue..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="maps-link">Google Maps Link</Label>
                  <Input
                    id="maps-link"
                    value={event.venue_maps_link || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, venue_maps_link: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ venue_maps_link: e.target.value })}
                    placeholder="https://maps.google.com/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Attendees will use this link for directions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Organizer Contact Details */}
            <Card>
              <CardHeader>
                <CardTitle>Organizer Contact</CardTitle>
                <CardDescription>
                  Contact information displayed to attendees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={event.organization_name || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, organization_name: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ organization_name: e.target.value })}
                    placeholder="Your organization name"
                  />
                </div>

                <div>
                  <Label htmlFor="organizer-name">Organizer Name</Label>
                  <Input
                    id="organizer-name"
                    value={event.organizer_name || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, organizer_name: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ organizer_name: e.target.value })}
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <Label htmlFor="organizer-email">Contact Email</Label>
                  <Input
                    id="organizer-email"
                    type="email"
                    value={event.organizer_email || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, organizer_email: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ organizer_email: e.target.value })}
                    placeholder="contact@organization.com"
                  />
                </div>

                <div>
                  <Label htmlFor="organizer-phone">Contact Phone</Label>
                  <Input
                    id="organizer-phone"
                    value={event.organizer_phone || ''}
                    onChange={(e) => setEvent(prev => prev ? { ...prev, organizer_phone: e.target.value } : null)}
                    onBlur={(e) => updateVenueDetails({ organizer_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}