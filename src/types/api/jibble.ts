// API Response Types
export interface JibbleResponse<T> {
    value: T[];
  }
  
  export interface JibblePerson {
    id: string;
    fullName: string;
    email: string;
    status: string;
    role: string;
  }
  
  export interface JibbleTimesheet {
    daily: {
      date: string;
      firstIn: string;
      lastOut: string;
      payrollHours: string;
    }[];
  }
  
  export interface JibbleTokenResponse {
    access_token: string;
    expires_in: number;
    token_type: string;
  }
  
  // Error Types
  export interface JibbleError {
    code: string;
    message: string;
    details?: unknown;
  }