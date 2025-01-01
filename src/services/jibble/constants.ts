export const JIBBLE_API = {
  BASE_URL: 'https://time-attendance.prod.jibble.io/v1',
  IDENTITY_URL: 'https://identity.prod.jibble.io/connect/token',
  WORKSPACE_URL: 'https://workspace.prod.jibble.io/v1',
  ENDPOINTS: {
    PEOPLE: '/People',
    TIMESHEETS: '/TimesheetsSummary'
  }
} as const;