export const JIBBLE_API = {
  BASE_URL: 'https://time-attendance.prod.jibble.io/v1',
  IDENTITY_URL: 'https://identity.prod.jibble.io/connect/token',
  WORKSPACE_URL: 'https://workspace.prod.jibble.io/v1',
  TIMESHEET_URL: 'https://time-attendance.prod.jibble.io/v1/TimesheetsSummary',
  ENDPOINTS: {
    PEOPLE: '/People',
    TIMESHEETS: '/TimesheetsSummary',
    TOKEN: '/connect/token'
  }
} as const;

export const ERROR_MESSAGES = {
  NO_TOKEN: 'No token available',
  INVALID_RESPONSE: 'Invalid API response',
  FETCH_ERROR: 'Failed to fetch data'
} as const;