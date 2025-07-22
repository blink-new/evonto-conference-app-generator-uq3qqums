import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, Download, Users, Mail, Phone, Building, Trash2, Plus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { blink } from '@/blink/client'
import { validateAttendee, validateCsvData, ValidationError } from '@/utils/validation'

interface Attendee {
  id: string
  event_id: string
  email: string
  first_name: string
  last_name: string
  company?: string
  job_title?: string
  phone?: string
  created_at: string
}

interface Event {
  id: string
  name: string
  organizer_id: string
}

export default function AttendeeManagement() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [csvData, setCsvData] = useState('')
  const [csvError, setCsvError] = useState('')
  const [attendeeErrors, setAttendeeErrors] = useState<Record<string, string>>({})
  const [newAttendee, setNewAttendee] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    job_title: '',
    phone: ''
  })

  const loadEventAndAttendees = useCallback(async () => {
    if (!eventId) return

    try {
      const [eventData, attendeeData] = await Promise.all([
        blink.db.events.list({ where: { id: eventId }, limit: 1 }),
        blink.db.attendees.list({ where: { event_id: eventId } })
      ])

      if (eventData.length > 0) {
        setEvent(eventData[0])
      }
      setAttendees(attendeeData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load event data')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  const validateCsvDataLocal = (data: string) => {
    const validation = validateCsvData(data)
    
    if (!validation.isValid) {
      setCsvError(validation.errors[0].message)
      return
    }

    setCsvError('')
  }

  useEffect(() => {
    loadEventAndAttendees()
  }, [loadEventAndAttendees])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setCsvData(content)
      validateCsvDataLocal(content)
    }
    reader.readAsText(file)
  }

  const processCsvUpload = async () => {
    if (!csvData || csvError || !eventId) return

    setUploading(true)
    try {
      const lines = csvData.trim().split('\n')
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
      const dataLines = lines.slice(1)

      const newAttendees = dataLines.map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const attendee: any = { event_id: eventId }

        headers.forEach((header, index) => {
          if (values[index]) {
            attendee[header] = values[index]
          }
        })

        return attendee
      })

      await blink.db.attendees.createMany(newAttendees)
      await loadEventAndAttendees()
      setCsvData('')
      toast.success(`Successfully uploaded ${newAttendees.length} attendees`)
    } catch (error) {
      console.error('Error uploading attendees:', error)
      toast.error('Failed to upload attendees')
    } finally {
      setUploading(false)
    }
  }

  const addSingleAttendee = async () => {
    if (!eventId) return

    // Validate attendee data
    const validation = validateAttendee(newAttendee)
    
    if (!validation.isValid) {
      const newErrors: Record<string, string> = {}
      validation.errors.forEach(error => {
        newErrors[error.field] = error.message
      })
      setAttendeeErrors(newErrors)
      
      toast.error('Please fix the validation errors')
      return
    }

    // Clear any existing errors
    setAttendeeErrors({})

    try {
      await blink.db.attendees.create({
        ...newAttendee,
        event_id: eventId
      })
      
      await loadEventAndAttendees()
      setNewAttendee({
        email: '',
        first_name: '',
        last_name: '',
        company: '',
        job_title: '',
        phone: ''
      })
      setShowAddDialog(false)
      toast.success('Attendee added successfully')
    } catch (error) {
      console.error('Error adding attendee:', error)
      toast.error('Failed to add attendee')
    }
  }

  const deleteAttendee = async (attendeeId: string) => {
    try {
      await blink.db.attendees.delete(attendeeId)
      await loadEventAndAttendees()
      toast.success('Attendee removed successfully')
    } catch (error) {
      console.error('Error deleting attendee:', error)
      toast.error('Failed to remove attendee')
    }
  }

  const downloadTemplate = () => {
    const template = 'email,first_name,last_name,company,job_title,phone\nexample@email.com,John,Doe,Acme Corp,Developer,+1234567890'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendee_template.csv'
    a.click()
    URL.revokeObjectURL(url)
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendee data...</p>
        </div>
      </div>
    )
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Attendee Management</h1>
              <p className="text-gray-600 mt-2">
                Manage attendees for {event?.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {attendees.length} Attendees
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Attendees
                </CardTitle>
                <CardDescription>
                  Upload attendees via CSV file or add them individually
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* CSV Upload */}
                <div>
                  <Label htmlFor="csv-upload">CSV File Upload</Label>
                  <div className="mt-2">
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mb-3"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="w-full mb-3"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>

                {csvData && (
                  <div>
                    <Label>CSV Preview</Label>
                    <Textarea
                      value={csvData.split('\n').slice(0, 5).join('\n')}
                      readOnly
                      className="mt-2 h-24 text-sm"
                    />
                    {csvError && (
                      <Alert className="mt-2">
                        <AlertDescription className="text-red-600">
                          {csvError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button
                      onClick={processCsvUpload}
                      disabled={!!csvError || uploading}
                      className="w-full mt-3"
                    >
                      {uploading ? 'Uploading...' : 'Upload Attendees'}
                    </Button>
                  </div>
                )}

                {/* Manual Add */}
                <div className="pt-4 border-t">
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Individual Attendee
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Attendee</DialogTitle>
                        <DialogDescription>
                          Enter the attendee details below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="first_name">First Name *</Label>
                            <Input
                              id="first_name"
                              value={newAttendee.first_name}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, first_name: e.target.value }))}
                              className={attendeeErrors.first_name ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            <FieldError error={attendeeErrors.first_name} />
                          </div>
                          <div>
                            <Label htmlFor="last_name">Last Name *</Label>
                            <Input
                              id="last_name"
                              value={newAttendee.last_name}
                              onChange={(e) => setNewAttendee(prev => ({ ...prev, last_name: e.target.value }))}
                              className={attendeeErrors.last_name ? 'border-red-500 focus:border-red-500' : ''}
                            />
                            <FieldError error={attendeeErrors.last_name} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newAttendee.email}
                            onChange={(e) => setNewAttendee(prev => ({ ...prev, email: e.target.value }))}
                            className={attendeeErrors.email ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          <FieldError error={attendeeErrors.email} />
                        </div>
                        <div>
                          <Label htmlFor="company">Company</Label>
                          <Input
                            id="company"
                            value={newAttendee.company}
                            onChange={(e) => setNewAttendee(prev => ({ ...prev, company: e.target.value }))}
                            className={attendeeErrors.company ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          <FieldError error={attendeeErrors.company} />
                        </div>
                        <div>
                          <Label htmlFor="job_title">Job Title</Label>
                          <Input
                            id="job_title"
                            value={newAttendee.job_title}
                            onChange={(e) => setNewAttendee(prev => ({ ...prev, job_title: e.target.value }))}
                            className={attendeeErrors.job_title ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          <FieldError error={attendeeErrors.job_title} />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={newAttendee.phone}
                            onChange={(e) => setNewAttendee(prev => ({ ...prev, phone: e.target.value }))}
                            className={attendeeErrors.phone ? 'border-red-500 focus:border-red-500' : ''}
                          />
                          <FieldError error={attendeeErrors.phone} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={addSingleAttendee}>
                          Add Attendee
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendees List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendee List</CardTitle>
                <CardDescription>
                  All registered attendees for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendees.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attendees yet</h3>
                    <p className="text-gray-600 mb-4">
                      Upload a CSV file or add attendees individually to get started
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendees.map((attendee) => (
                          <TableRow key={attendee.id}>
                            <TableCell className="font-medium">
                              {attendee.first_name} {attendee.last_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {attendee.email}
                              </div>
                            </TableCell>
                            <TableCell>
                              {attendee.company && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4 text-gray-400" />
                                  {attendee.company}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{attendee.job_title}</TableCell>
                            <TableCell>
                              {attendee.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  {attendee.phone}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAttendee(attendee.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/configure`)}
          >
            Back to Configuration
          </Button>
          <Button
            onClick={() => navigate(`/events/${eventId}/preview`)}
            disabled={attendees.length === 0}
          >
            Continue to Preview
          </Button>
        </div>
      </div>
    </div>
  )
}