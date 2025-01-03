export interface JibbleError {
  code: string;
  message: string;
  details?: unknown;
}

export interface JibbleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface JibblePerson {
  id: string;
  fullName: string;
  email: string;
  status: string;
  role: string;
}

export interface TimesheetSummary {
  daily: {
    date: string;
    firstIn: string;
    lastOut: string;
    payrollHours: string;
  }[];
}

export interface JibbleResponse<T> {
  value: T[];
}