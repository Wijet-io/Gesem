export const JIBBLE_API = {
  BASE_URL: 'https://workspace.prod.jibble.io/v1',
  AUTH_URL: 'https://identity.prod.jibble.io/connect/token',
  ENDPOINTS: {
    PEOPLE: '/People',
    TIMESHEETS: '/timesheets-summary'
  }
} as const;