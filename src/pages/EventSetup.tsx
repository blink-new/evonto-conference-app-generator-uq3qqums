import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Palette, Calendar, Building, Mail, Phone, Globe, AlertCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'
import { validateEventSetup, ValidationError } from '../utils/validation'

interface EventData {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  primary_color: string
  accent_color: string
  organizer_name: string
  organizer_email: string
  organizer_phone: string
  organization_name: string
  organization_website: string
}

const EventSetup = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [eventData, setEventData] = useState<EventData>({
    id: '',
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    primary_color: '#6366F1',
    accent_color: '#F59E0B',
    organizer_name: '',
    organizer_email: '',
    organizer_phone: '',
    organization_name: '',
    organization_website: ''
  })

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const events = await blink.db.events.list({
          where: { id: eventId }
        })
        
        if (events.length === 0) {
          toast({
            title: "Error",
            description: "Event not found",
            variant: "destructive"
          })
          navigate('/dashboard')
          return
        }
        
        const event = events[0]
        setEventData({
          id: event.id,
          name: event.name || '',
          description: event.description || '',
          start_date: event.start_date || '',
          end_date: event.end_date || '',
          primary_color: event.primary_color || '#6366F1',
          accent_color: event.accent_color || '#F59E0B',
          organizer_name: event.organizer_name || '',
          organizer_email: event.organizer_email || '',
          organizer_phone: event.organizer_phone || '',
          organization_name: event.organization_name || '',
          organization_website: event.organization_website || ''
        })
      } catch (error) {
        console.error('Error loading event:', error)
        toast({
          title: "Error",
          description: "Failed to load event data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      loadEvent()
    }
  }, [eventId, navigate, toast])

  const handleInputChange = (field: keyof EventData, value: string) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Real-time validation for critical fields
    if (field === 'name' || field === 'start_date' || field === 'end_date') {
      const tempData = { ...eventData, [field]: value }
      const validation = validateEventSetup(tempData)
      const fieldError = validation.errors.find(error => error.field === field)
      
      if (fieldError) {
        setFieldErrors(prev => ({
          ...prev,
          [field]: fieldError.message
        }))
      }
    }
  }

  const handleSave = async () => {
    // Validate form before saving
    const validation = validateEventSetup(eventData)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      
      // Convert errors to field-specific errors for better UX
      const newFieldErrors: Record<string, string> = {}
      validation.errors.forEach(error => {
        newFieldErrors[error.field] = error.message
      })
      setFieldErrors(newFieldErrors)
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before saving",
        variant: "destructive"
      })
      return
    }
    
    // Clear any existing errors
    setValidationErrors([])
    setFieldErrors({})
    
    setSaving(true)
    try {
      await blink.db.events.update(eventData.id, {
        name: eventData.name,
        description: eventData.description,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        primary_color: eventData.primary_color,
        accent_color: eventData.accent_color,
        organizer_name: eventData.organizer_name,
        organizer_email: eventData.organizer_email,
        organizer_phone: eventData.organizer_phone,
        organization_name: eventData.organization_name,
        organization_website: eventData.organization_website,
        updated_at: new Date().toISOString()
      })
      
      toast({
        title: "Success",
        description: "Event details saved successfully"
      })
    } catch (error) {
      console.error('Error saving event:', error)
      toast({
        title: "Error",
        description: "Failed to save event details",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const predefinedColors = [
    { name: 'Indigo', primary: '#6366F1', accent: '#F59E0B' },
    { name: 'Blue', primary: '#3B82F6', accent: '#EF4444' },
    { name: 'Purple', primary: '#8B5CF6', accent: '#F97316' },
    { name: 'Green', primary: '#10B981', accent: '#8B5CF6' },
    { name: 'Red', primary: '#EF4444', accent: '#3B82F6' },
    { name: 'Pink', primary: '#EC4899', accent: '#10B981' }
  ]

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
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/dashboard" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Event Setup</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Validation Errors Summary */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Please fix the following errors:</div>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Event Information
              </CardTitle>
              <CardDescription>
                Basic details about your conference or event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={eventData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Tech Conference 2024"
                    className={fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.name} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization Name</Label>
                  <Input
                    id="organization"
                    value={eventData.organization_name}
                    onChange={(e) => handleInputChange('organization_name', e.target.value)}
                    placeholder="e.g., Tech Corp"
                    className={fieldErrors.organization_name ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.organization_name} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea
                  id="description"
                  value={eventData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event, its purpose, and what attendees can expect..."
                  rows={3}
                  className={fieldErrors.description ? 'border-red-500 focus:border-red-500' : ''}
                />
                <FieldError error={fieldErrors.description} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={eventData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={fieldErrors.start_date ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.start_date} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={eventData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={fieldErrors.end_date ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.end_date} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                App Color Theme
              </CardTitle>
              <CardDescription>
                Choose colors that match your event branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Predefined Color Themes */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Quick Color Themes</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {predefinedColors.map((theme) => (
                    <button
                      key={theme.name}
                      onClick={() => {
                        handleInputChange('primary_color', theme.primary)
                        handleInputChange('accent_color', theme.accent)
                      }}
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex space-x-1 mr-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={eventData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={eventData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      placeholder="#6366F1"
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={eventData.accent_color}
                      onChange={(e) => handleInputChange('accent_color', e.target.value)}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={eventData.accent_color}
                      onChange={(e) => handleInputChange('accent_color', e.target.value)}
                      placeholder="#F59E0B"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Color Preview */}
              <div className="p-4 border rounded-lg" style={{ backgroundColor: eventData.primary_color + '10' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium" style={{ color: eventData.primary_color }}>
                      {eventData.name || 'Your Event Name'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">Color theme preview</p>
                  </div>
                  <Button 
                    size="sm" 
                    style={{ 
                      backgroundColor: eventData.accent_color,
                      color: 'white'
                    }}
                  >
                    Sample Button
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Organizer Contact Information
              </CardTitle>
              <CardDescription>
                Contact details that will be shown to attendees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organizer_name">Organizer Name</Label>
                  <Input
                    id="organizer_name"
                    value={eventData.organizer_name}
                    onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                    placeholder="e.g., John Smith"
                    className={fieldErrors.organizer_name ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.organizer_name} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organizer_email">Contact Email</Label>
                  <Input
                    id="organizer_email"
                    type="email"
                    value={eventData.organizer_email}
                    onChange={(e) => handleInputChange('organizer_email', e.target.value)}
                    placeholder="e.g., contact@techconf.com"
                    className={fieldErrors.organizer_email ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.organizer_email} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organizer_phone">Contact Phone</Label>
                  <Input
                    id="organizer_phone"
                    type="tel"
                    value={eventData.organizer_phone}
                    onChange={(e) => handleInputChange('organizer_phone', e.target.value)}
                    placeholder="e.g., +1 (555) 123-4567"
                    className={fieldErrors.organizer_phone ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.organizer_phone} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="organization_website">Organization Website</Label>
                  <Input
                    id="organization_website"
                    type="url"
                    value={eventData.organization_website}
                    onChange={(e) => handleInputChange('organization_website', e.target.value)}
                    placeholder="e.g., https://techcorp.com"
                    className={fieldErrors.organization_website ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  <FieldError error={fieldErrors.organization_website} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="flex justify-between items-center pt-6">
            <p className="text-sm text-gray-600">
              Save your changes and continue to configure your event schedule
            </p>
            <Link to={`/event/${eventId}/configure`}>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Continue to App Configuration
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default EventSetup