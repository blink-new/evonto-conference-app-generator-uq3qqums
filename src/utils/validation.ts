// Form validation utilities for the Event App configuration workflow

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone validation (supports various formats)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''))
}

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Color validation (hex format)
export const validateColor = (color: string): boolean => {
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return colorRegex.test(color)
}

// Date validation
export const validateDate = (date: string): boolean => {
  if (!date) return false
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

// Time validation (HH:MM format)
export const validateTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

// Event Setup Validation
export const validateEventSetup = (eventData: any): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  if (!eventData.name?.trim()) {
    errors.push({ field: 'name', message: 'Event name is required' })
  } else if (eventData.name.length < 3) {
    errors.push({ field: 'name', message: 'Event name must be at least 3 characters long' })
  } else if (eventData.name.length > 100) {
    errors.push({ field: 'name', message: 'Event name must be less than 100 characters' })
  }

  if (!eventData.start_date) {
    errors.push({ field: 'start_date', message: 'Start date is required' })
  } else if (!validateDate(eventData.start_date)) {
    errors.push({ field: 'start_date', message: 'Please enter a valid start date' })
  }

  if (!eventData.end_date) {
    errors.push({ field: 'end_date', message: 'End date is required' })
  } else if (!validateDate(eventData.end_date)) {
    errors.push({ field: 'end_date', message: 'Please enter a valid end date' })
  }

  // Date range validation
  if (eventData.start_date && eventData.end_date && validateDate(eventData.start_date) && validateDate(eventData.end_date)) {
    const startDate = new Date(eventData.start_date)
    const endDate = new Date(eventData.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (startDate < today) {
      errors.push({ field: 'start_date', message: 'Start date cannot be in the past' })
    }

    if (endDate < startDate) {
      errors.push({ field: 'end_date', message: 'End date must be after start date' })
    }

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      errors.push({ field: 'end_date', message: 'Event duration cannot exceed 365 days' })
    }
  }

  // Optional field validations
  if (eventData.description && eventData.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' })
  }

  if (eventData.organizer_email && !validateEmail(eventData.organizer_email)) {
    errors.push({ field: 'organizer_email', message: 'Please enter a valid email address' })
  }

  if (eventData.organizer_phone && !validatePhone(eventData.organizer_phone)) {
    errors.push({ field: 'organizer_phone', message: 'Please enter a valid phone number' })
  }

  if (eventData.organization_website && !validateUrl(eventData.organization_website)) {
    errors.push({ field: 'organization_website', message: 'Please enter a valid website URL' })
  }

  // Color validations
  if (eventData.primary_color && !validateColor(eventData.primary_color)) {
    errors.push({ field: 'primary_color', message: 'Please enter a valid hex color code' })
  }

  if (eventData.accent_color && !validateColor(eventData.accent_color)) {
    errors.push({ field: 'accent_color', message: 'Please enter a valid hex color code' })
  }

  // Organization name validation
  if (eventData.organization_name && eventData.organization_name.length > 100) {
    errors.push({ field: 'organization_name', message: 'Organization name must be less than 100 characters' })
  }

  if (eventData.organizer_name && eventData.organizer_name.length > 100) {
    errors.push({ field: 'organizer_name', message: 'Organizer name must be less than 100 characters' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Session Validation
export const validateSession = (session: any, eventStartDate?: string, eventEndDate?: string): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  if (!session.title?.trim()) {
    errors.push({ field: 'title', message: 'Session title is required' })
  } else if (session.title.length < 3) {
    errors.push({ field: 'title', message: 'Session title must be at least 3 characters long' })
  } else if (session.title.length > 200) {
    errors.push({ field: 'title', message: 'Session title must be less than 200 characters' })
  }

  if (!session.start_time) {
    errors.push({ field: 'start_time', message: 'Start time is required' })
  } else if (!validateTime(session.start_time)) {
    errors.push({ field: 'start_time', message: 'Please enter a valid start time' })
  }

  if (!session.end_time) {
    errors.push({ field: 'end_time', message: 'End time is required' })
  } else if (!validateTime(session.end_time)) {
    errors.push({ field: 'end_time', message: 'Please enter a valid end time' })
  }

  if (!session.date) {
    errors.push({ field: 'date', message: 'Session date is required' })
  } else if (!validateDate(session.date)) {
    errors.push({ field: 'date', message: 'Please enter a valid date' })
  }

  // Time range validation
  if (session.start_time && session.end_time && validateTime(session.start_time) && validateTime(session.end_time)) {
    const [startHour, startMin] = session.start_time.split(':').map(Number)
    const [endHour, endMin] = session.end_time.split(':').map(Number)
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin

    if (endMinutes <= startMinutes) {
      errors.push({ field: 'end_time', message: 'End time must be after start time' })
    }

    const durationMinutes = endMinutes - startMinutes
    if (durationMinutes < 15) {
      errors.push({ field: 'end_time', message: 'Session must be at least 15 minutes long' })
    }

    if (durationMinutes > 480) { // 8 hours
      errors.push({ field: 'end_time', message: 'Session cannot be longer than 8 hours' })
    }
  }

  // Date range validation (if event dates are provided)
  if (session.date && eventStartDate && eventEndDate && validateDate(session.date)) {
    const sessionDate = new Date(session.date)
    const eventStart = new Date(eventStartDate)
    const eventEnd = new Date(eventEndDate)

    if (sessionDate < eventStart || sessionDate > eventEnd) {
      errors.push({ field: 'date', message: 'Session date must be within the event date range' })
    }
  }

  // Optional field validations
  if (session.description && session.description.length > 500) {
    errors.push({ field: 'description', message: 'Description must be less than 500 characters' })
  }

  if (session.speaker && session.speaker.length > 100) {
    errors.push({ field: 'speaker', message: 'Speaker name must be less than 100 characters' })
  }

  if (session.venue && session.venue.length > 100) {
    errors.push({ field: 'venue', message: 'Venue name must be less than 100 characters' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Attendee Validation
export const validateAttendee = (attendee: any): ValidationResult => {
  const errors: ValidationError[] = []

  // Required fields
  if (!attendee.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' })
  } else if (!validateEmail(attendee.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' })
  }

  if (!attendee.first_name?.trim()) {
    errors.push({ field: 'first_name', message: 'First name is required' })
  } else if (attendee.first_name.length < 2) {
    errors.push({ field: 'first_name', message: 'First name must be at least 2 characters long' })
  } else if (attendee.first_name.length > 50) {
    errors.push({ field: 'first_name', message: 'First name must be less than 50 characters' })
  }

  if (!attendee.last_name?.trim()) {
    errors.push({ field: 'last_name', message: 'Last name is required' })
  } else if (attendee.last_name.length < 2) {
    errors.push({ field: 'last_name', message: 'Last name must be at least 2 characters long' })
  } else if (attendee.last_name.length > 50) {
    errors.push({ field: 'last_name', message: 'Last name must be less than 50 characters' })
  }

  // Optional field validations
  if (attendee.company && attendee.company.length > 100) {
    errors.push({ field: 'company', message: 'Company name must be less than 100 characters' })
  }

  if (attendee.job_title && attendee.job_title.length > 100) {
    errors.push({ field: 'job_title', message: 'Job title must be less than 100 characters' })
  }

  if (attendee.phone && !validatePhone(attendee.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// CSV Validation
export const validateCsvData = (csvData: string): ValidationResult => {
  const errors: ValidationError[] = []

  if (!csvData.trim()) {
    errors.push({ field: 'csv', message: 'CSV data is required' })
    return { isValid: false, errors }
  }

  const lines = csvData.trim().split('\n')
  
  if (lines.length < 2) {
    errors.push({ field: 'csv', message: 'CSV must contain at least a header row and one data row' })
    return { isValid: false, errors }
  }

  const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
  const requiredHeaders = ['email', 'first_name', 'last_name']
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

  if (missingHeaders.length > 0) {
    errors.push({ field: 'csv', message: `Missing required columns: ${missingHeaders.join(', ')}` })
  }

  // Validate data rows
  const dataLines = lines.slice(1)
  const emailIndex = headers.indexOf('email')
  const firstNameIndex = headers.indexOf('first_name')
  const lastNameIndex = headers.indexOf('last_name')

  dataLines.forEach((line, index) => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const rowNumber = index + 2 // +2 because we start from line 2 (after header)

    if (emailIndex >= 0 && values[emailIndex] && !validateEmail(values[emailIndex])) {
      errors.push({ field: 'csv', message: `Row ${rowNumber}: Invalid email format` })
    }

    if (firstNameIndex >= 0 && (!values[firstNameIndex] || values[firstNameIndex].length < 2)) {
      errors.push({ field: 'csv', message: `Row ${rowNumber}: First name is required and must be at least 2 characters` })
    }

    if (lastNameIndex >= 0 && (!values[lastNameIndex] || values[lastNameIndex].length < 2)) {
      errors.push({ field: 'csv', message: `Row ${rowNumber}: Last name is required and must be at least 2 characters` })
    }
  })

  // Limit validation errors to first 10 to avoid overwhelming the user
  if (errors.length > 10) {
    errors.splice(10)
    errors.push({ field: 'csv', message: 'And more validation errors... Please fix the above issues first.' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Venue Validation
export const validateVenue = (venue: any): ValidationResult => {
  const errors: ValidationError[] = []

  if (venue.venue_name && venue.venue_name.length > 200) {
    errors.push({ field: 'venue_name', message: 'Venue name must be less than 200 characters' })
  }

  if (venue.venue_address && venue.venue_address.length > 500) {
    errors.push({ field: 'venue_address', message: 'Venue address must be less than 500 characters' })
  }

  if (venue.venue_maps_link && !validateUrl(venue.venue_maps_link)) {
    errors.push({ field: 'venue_maps_link', message: 'Please enter a valid Google Maps URL' })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}