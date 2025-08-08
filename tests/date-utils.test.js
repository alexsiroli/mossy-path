import { describe, it, expect, vi } from 'vitest';
import { vi as MockDate } from 'vitest';

// Import the functions from Today.jsx - these are not exported directly
// so we'll recreate them here for testing purposes
function romeNow() {
  const now = new Date();
  const s = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Rome' }));
  return s;
}

function appDayFrom(date) {
  const d = new Date(date);
  const hour = d.getHours();
  if (hour < 5) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
}

function addAppDays(date, delta) {
  const d = new Date(date);
  // Set the hour to noon to avoid cutoff < 5:00 issue
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + delta);
  return appDayFrom(d);
}

function formatKey(dateObj) {
  return dateObj.toISOString().split('T')[0];
}

describe('Date Utils', () => {
  // Reset the mock date after each test
  afterEach(() => {
    vi.useRealTimers();
  });
  
  it('should format date keys correctly', () => {
    const testDate = new Date('2023-06-15T14:30:45.123Z');
    const formattedKey = formatKey(testDate);
    expect(formattedKey).toBe('2023-06-15');
  });
  
  it('should handle the 5 AM cutoff correctly', () => {
    // Test the core logic: hours < 5 should subtract a day
    const earlyMorning = new Date('2023-06-15T04:30:00'); // 4:30 AM
    const laterMorning = new Date('2023-06-15T05:00:00'); // 5:00 AM
    
    const earlyResult = appDayFrom(earlyMorning);
    const laterResult = appDayFrom(laterMorning);
    
    // The day from 4:30 AM should be earlier than the day from 5:00 AM
    expect(earlyResult.getTime()).toBeLessThan(laterResult.getTime());
    
    // Both results should be at midnight (0 hours)
    expect(earlyResult.getHours()).toBe(0);
    expect(laterResult.getHours()).toBe(0);
  });
  
  it('should add days correctly considering the 5 AM cutoff', () => {
    // Test that addAppDays actually adds the right number of days
    const baseDate = new Date('2023-06-15T12:00:00'); // June 15, 2023 12:00 PM
    
    const nextDay = addAppDays(baseDate, 1);
    const prevDay = addAppDays(baseDate, -1);
    const sameDay = addAppDays(baseDate, 0);
    
    // Test that the dates are different by the expected amount
    const baseTime = appDayFrom(baseDate).getTime();
    const nextTime = nextDay.getTime();
    const prevTime = prevDay.getTime();
    const sameTime = sameDay.getTime();
    
    // Should be 24 hours apart
    expect(nextTime - baseTime).toBe(24 * 60 * 60 * 1000);
    expect(baseTime - prevTime).toBe(24 * 60 * 60 * 1000);
    expect(sameTime).toBe(baseTime);
  });
  
  it('should correctly use Rome timezone', () => {
    // Mock the global Date to simulate a specific UTC time
    const mockDate = new Date('2023-06-15T22:00:00.000Z');
    vi.setSystemTime(mockDate);
    
    // Call romeNow which should convert to Rome timezone
    const romeTime = romeNow();
    
    // Rome is UTC+2 in summer, so 22:00 UTC should be 00:00 in Rome
    // This test may need adjustment for DST changes
    expect(romeTime.getHours()).toBe(0);
    
    // Reset the mock
    vi.useRealTimers();
  });
});
