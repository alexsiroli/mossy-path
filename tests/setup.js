import '@testing-library/jest-dom';

// Mock for the firebase.js file
vi.mock('../src/config/firebase', () => {
  return {
    auth: {
      currentUser: null,
    },
    db: {},
  };
});

// Do not mock storage in setup, let tests import the real functions

// Mock for DB operations
vi.mock('../src/utils/db', () => {
  return {
    saveWeeklyActivities: vi.fn(),
    saveCompletions: vi.fn(),
    saveUserSettings: vi.fn(),
  };
});
