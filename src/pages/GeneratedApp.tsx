import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Share2, QrCode, Smartphone, Globe, CheckCircle, ExternalLink, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

export default function GeneratedApp() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [appUrl] = useState(`https://app.evonto.com/events/${eventId}`)
  const [qrCodeUrl] = useState(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`https://app.evonto.com/events/${eventId}`)}`)

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) return

      try {
        const eventData = await blink.db.events.list({ where: { id: eventId }, limit: 1 })
        if (eventData.length > 0) {
          setEvent(eventData[0])
        }
      } catch (error) {
        console.error('Error loading event:', error)
        toast.error('Failed to load event data')
      } finally {
        setLoading(false)
      }
    }

    loadEvent()
  }, [eventId])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard!`)
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `${event?.name}-qr-code.png`
    link.click()
  }

  const shareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event?.name} - Mobile App`,
          text: `Join ${event?.name} using our mobile app!`,
          url: appUrl
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyToClipboard(appUrl, 'App URL')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading generated app...</p>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">App Generated Successfully!</h1>
            <p className="text-gray-600 text-lg">
              Your mobile app for <span className="font-semibold">{event.name}</span> is ready to use
            </p>
          </div>
        </div>

        {/* Success Alert */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your conference mobile app has been successfully generated and deployed. 
            Attendees can now access it using the link or QR code below.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* App Access */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                App Access
              </CardTitle>
              <CardDescription>
                Share these details with your attendees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* App URL */}
              <div>
                <Label htmlFor="app-url">Mobile App URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="app-url"
                    value={appUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(appUrl, 'App URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* QR Code */}
              <div>
                <Label>QR Code</Label>
                <div className="mt-2 text-center">
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for mobile app"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="mt-4 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadQRCode}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download QR
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={shareApp}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share App
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(appUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Mobile App
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate(`/events/${eventId}/preview`)}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    View App Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* App Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                App Features
              </CardTitle>
              <CardDescription>
                What's included in your mobile app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Email Authentication</h4>
                    <p className="text-sm text-gray-600">
                      Secure 6-digit email verification for attendee access
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Event Schedule</h4>
                    <p className="text-sm text-gray-600">
                      Complete session schedule with bookmarking capability
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Attendee Directory</h4>
                    <p className="text-sm text-gray-600">
                      Browse and connect with other event attendees
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Custom Branding</h4>
                    <p className="text-sm text-gray-600">
                      Your event colors and branding throughout the app
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Mobile Optimized</h4>
                    <p className="text-sm text-gray-600">
                      Responsive design that works perfectly on all devices
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-gray-900">Real-time Updates</h4>
                    <p className="text-sm text-gray-600">
                      Instant updates for schedule changes and announcements
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Details */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Summary of your generated mobile app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Event Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium">{event.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(event.start_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{event.location}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">App Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Primary Color:</span>
                    <div className="flex items-center gap-2 ml-2">
                      <div
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: event.primary_color }}
                      ></div>
                      <span className="font-mono">{event.primary_color}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="secondary" className="ml-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/events/${eventId}/configure`)}
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/events/${eventId}/attendees`)}
                  >
                    Manage Attendees
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
            <CardDescription>
              How to share your app with attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Share with Attendees</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Send the app URL via email to all registered attendees
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Print the QR code on event materials and signage
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Share on social media and event websites
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Include in event registration confirmation emails
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">App Management</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Monitor attendee engagement through the dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Update event details and schedule as needed
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Add or remove attendees from the app
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></div>
                    Generate new apps for future events
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/preview`)}
          >
            Back to Preview
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}