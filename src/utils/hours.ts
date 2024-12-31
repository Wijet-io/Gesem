export function formatHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

export function parseHours(hoursString: string): number {
  const match = hoursString.match(/^(\d+)h(?:\s*(\d+)m)?$/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  
  return hours + (minutes / 60);
}

export function calculateExtraHours(workedHours: number, contractHours: number): {
  normalHours: number;
  extraHours: number;
} {
  if (workedHours <= contractHours) {
    return {
      normalHours: workedHours,
      extraHours: 0
    };
  }

  return {
    normalHours: contractHours,
    extraHours: workedHours - contractHours
  };
}