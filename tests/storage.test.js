import { describe, it, expect, vi, beforeEach } from 'vitest';
import { load, save, isConfigured, isNewUser } from '../src/utils/storage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

// Replace the global localStorage with our mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('Storage Utility', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });
  
  it('should save and load data correctly', () => {
    const userId = 'test-user-123';
    const testData = {
      baseActivities: ['Activity 1', 'Activity 2'],
      sleep: { bedtime: '22:30', wakeup: '07:00' }
    };
    
    // Save data
    save(testData, userId);
    
    // Verify localStorage.setItem was called correctly
    expect(localStorage.setItem).toHaveBeenCalledWith(
      `mossypath:data:${userId}`, 
      JSON.stringify(testData)
    );
    
    // Load data
    const loadedData = load(userId);
    
    // Verify localStorage.getItem was called correctly
    expect(localStorage.getItem).toHaveBeenCalledWith(`mossypath:data:${userId}`);
    
    // Verify loaded data matches saved data
    expect(loadedData).toEqual(testData);
  });
  
  it('should return empty object when loading non-existent data', () => {
    const userId = 'non-existent-user';
    
    // Load data that doesn't exist
    const loadedData = load(userId);
    
    // Verify localStorage.getItem was called correctly
    expect(localStorage.getItem).toHaveBeenCalledWith(`mossypath:data:${userId}`);
    
    // Should return empty object
    expect(loadedData).toEqual({});
  });
  
  it('should handle invalid JSON when loading', () => {
    const userId = 'invalid-json-user';
    
    // Set invalid JSON in localStorage
    localStorage.setItem(`mossypath-${userId}`, 'invalid-json');
    
    // Load data with invalid JSON
    const loadedData = load(userId);
    
    // Should return empty object on JSON parse error
    expect(loadedData).toEqual({});
  });
  
  it('should detect configured user correctly', () => {
    const userId = 'configured-user';
    
    // User with no data should not be configured
    expect(isConfigured(userId)).toBe(false);
    
    // Save incomplete data - should still not be configured
    save({ baseActivities: ['Activity 1'] }, userId);
    expect(isConfigured(userId)).toBe(false);
    
    // Save complete data with all required fields
    save({ 
      baseActivities: ['Activity 1'], 
      sleep: { bedtime: '22:30', wakeup: '07:00' },
      dailyActivities: [],
      malus: []
    }, userId);
    
    // Now user should be configured
    expect(isConfigured(userId)).toBe(true);
    
    // Save empty baseActivities
    save({ baseActivities: [] }, userId);
    
    // User should not be configured with empty baseActivities
    expect(isConfigured(userId)).toBe(false);
  });
  
  it('should detect new user correctly', () => {
    const userId = 'new-user';
    
    // User with no data should be considered new
    expect(isNewUser(userId)).toBe(true);
    
    // Save some data with any of the expected properties
    save({ baseActivities: ['Activity 1'] }, userId);
    
    // User should no longer be considered new
    expect(isNewUser(userId)).toBe(false);
  });
  
  it('should handle null userId gracefully', () => {
    // Loading with null userId should return empty object
    expect(load(null)).toEqual({});
    
    // Saving with null userId should not throw
    expect(() => save({ data: true }, null)).not.toThrow();
    
    // isConfigured with null userId should return false
    expect(isConfigured(null)).toBe(false);
    
    // isNewUser with null userId should return true
    expect(isNewUser(null)).toBe(true);
  });
});
