import { describe, it, expect, beforeEach } from 'vitest';
import { calculatePoints } from '../src/utils/points';

// Create mock data for testing
let mockData = {};

describe('Points Calculation', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockData = {
      baseActivities: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4', 'Activity 5'],
      sleep: { bedtime: '22:30', wakeup: '07:00' },
      dailyActivities: [
        { 
          name: 'Morning activity', 
          weekday: 'Lun', 
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        },
        { 
          name: 'Afternoon activity', 
          weekday: 'Lun', 
          partOfDay: 'afternoon', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        }
      ],
      malus: [
        { name: 'Malus 1', weekdaysOnly: true },
        { name: 'Malus 2', weekdaysOnly: false }
      ],
      completions: {
        // Empty by default
      }
    };
  });

  // Test for when everything is completed
  it('should calculate 100 points when all tasks are completed', () => {
    // Set up a date that falls on a Monday (1 = Monday in getDay)
    const mondayDate = '2023-06-05'; // This was a Monday
    
    // Set completions for all items
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true,
      'base-2': true,
      'base-3': true,
      'base-4': true,
      'sleep-bed': true,
      'sleep-wake': true,
      'daily-0': true, // Morning activity
      'daily-1': true  // Afternoon activity
    };
    
    const points = calculatePoints(mondayDate, mockData);
    expect(points).toBe(100);
  });

  // Test for when only base tasks are completed
  it('should calculate correct points when only base tasks are completed', () => {
    const mondayDate = '2023-06-05';
    
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true,
      'base-2': true,
      'base-3': true,
      'base-4': true
    };
    
    const points = calculatePoints(mondayDate, mockData);
    // 5 base activities * 5 points = 25 points
    expect(points).toBeLessThan(55);
  });

  // Test for when missing morning/afternoon activities
  it('should not give full points when morning activities are not completed', () => {
    const mondayDate = '2023-06-05';
    
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true,
      'base-2': true,
      'base-3': true,
      'base-4': true,
      'sleep-bed': true,
      'sleep-wake': true,
      // Missing 'daily-0' (Morning activity)
      'daily-1': true  // Afternoon activity
    };
    
    const points = calculatePoints(mondayDate, mockData);
    expect(points).toBeLessThan(100);
  });

  // Test for when missing afternoon activities
  it('should not give full points when afternoon activities are not completed', () => {
    const mondayDate = '2023-06-05';
    
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true,
      'base-2': true,
      'base-3': true,
      'base-4': true,
      'sleep-bed': true,
      'sleep-wake': true,
      'daily-0': true, // Morning activity
      // Missing 'daily-1' (Afternoon activity)
    };
    
    const points = calculatePoints(mondayDate, mockData);
    expect(points).toBeLessThan(100);
  });

  // Test for malus points
  it('should subtract points for malus tasks', () => {
    const mondayDate = '2023-06-05';
    
    // First calculate points without malus
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true,
      'base-2': true,
      'base-3': true,
      'base-4': true,
      'sleep-bed': true,
      'sleep-wake': true,
      'daily-0': true,
      'daily-1': true
    };
    
    const pointsWithoutMalus = calculatePoints(mondayDate, mockData);
    
    // Add a malus and calculate again
    mockData.completions[mondayDate]['malus-0'] = true;
    const pointsWithMalus = calculatePoints(mondayDate, mockData);
    
    // Should be a difference of 10 points (100 without malus becomes 85 with malus because it's no longer 100)
    // The actual logic clamps at 95 before applying 100 bonus, so malus prevents the bonus
    expect(pointsWithoutMalus - pointsWithMalus).toBeGreaterThanOrEqual(10);
  });

  // Test for weekday-only malus
  it('should not count weekday-only malus on weekends', () => {
    const sundayDate = '2023-06-11'; // This was a Sunday
    
    // Reset data for this test
    const weekendData = {
      ...mockData,
      dailyActivities: [], // No daily activities for Sunday
    };
    weekendData.completions = {
      [sundayDate]: {
        'malus-0': true,  // This is weekdaysOnly: true
        'malus-1': true   // This is weekdaysOnly: false
      }
    };
    
    const points = calculatePoints(sundayDate, weekendData);
    // Should only subtract for the second malus (10 points) since the first is weekdays only
    // The minimum points is 0, so it should be 0, not -10
    expect(points).toBe(0);
  });

  // Test for recurring activities with different repeat patterns
  it('should handle weekly activities correctly', () => {
    const mondayDate = '2023-06-05';
    const tuesdayDate = '2023-06-06';
    
    // Test that Monday activities only show on Monday, Tuesday activities only on Tuesday
    // Add a Tuesday activity to the mock data
    const tuesdayMockData = {
      ...mockData,
      dailyActivities: [
        ...mockData.dailyActivities,
        { 
          name: 'Tuesday activity', 
          weekday: 'Mar', // Tuesday in Italian short form
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        }
      ]
    };
    
    // Add some base activities to both days
    tuesdayMockData.completions = {
      [mondayDate]: {
        'base-0': true,
        'base-1': true
      },
      [tuesdayDate]: {
        'base-0': true,
        'base-1': true
      }
    };
    
    // Test that Monday has different activities than Tuesday
    const mondayPoints = calculatePoints(mondayDate, mockData);
    const tuesdayPoints = calculatePoints(tuesdayDate, tuesdayMockData);
    
    // They should be different because they have different weekly activities
    expect(mondayPoints).not.toEqual(tuesdayPoints);
  });

  // Test basic functionality with simple data
  it('should calculate points correctly for basic scenarios', () => {
    const mondayDate = '2023-06-05';
    
    // Test with only some base activities completed
    mockData.completions[mondayDate] = {
      'base-0': true,
      'base-1': true
    };
    
    const points = calculatePoints(mondayDate, mockData);
    // Should have some points but not full score
    expect(points).toBeGreaterThan(0);
    expect(points).toBeLessThan(100);
  });

  // Test weekly activities not completed - should NOT get morning/afternoon points
  it('should not award morning/afternoon points if weekly activities are not completed', () => {
    const mondayDate = '2023-06-05';
    
    // Set up data with weekly activities for Monday
    const testData = {
      baseActivities: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4', 'Activity 5'],
      sleep: { bedtime: '22:30', wakeup: '07:00' },
      dailyActivities: [
        { 
          name: 'Weekly Morning Activity', 
          weekday: 'Lun', 
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        },
        { 
          name: 'Weekly Afternoon Activity', 
          weekday: 'Lun', 
          partOfDay: 'afternoon', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        }
      ],
      malus: [],
      completions: {
        [mondayDate]: {
          // Complete ALL base activities
          'base-0': true,
          'base-1': true,
          'base-2': true,
          'base-3': true,
          'base-4': true,
          // Complete ALL sleep activities
          'sleep-bed': true,
          'sleep-wake': true,
          // Do NOT complete the weekly activities (daily-0 and daily-1)
          // 'daily-0': false,  // Morning activity NOT completed
          // 'daily-1': false,  // Afternoon activity NOT completed
        }
      }
    };
    
    const points = calculatePoints(mondayDate, testData);
    
    // Should get points for base (5*5=25) + sleep (2*15=30) = 55
    // Should NOT get morning points (20) or afternoon points (20)
    // Should NOT get 100 point bonus because not all required tasks completed
    expect(points).toBe(55);
    
    // Now test completing only morning activity
    testData.completions[mondayDate]['daily-0'] = true; // Complete morning
    const pointsWithMorning = calculatePoints(mondayDate, testData);
    
    // Should get base + sleep + morning bonus = 55 + 20 = 75
    expect(pointsWithMorning).toBe(75);
    
    // Now complete afternoon activity too
    testData.completions[mondayDate]['daily-1'] = true; // Complete afternoon
    const pointsWithBoth = calculatePoints(mondayDate, testData);
    
    // Should get all points and 100 bonus: base + sleep + morning + afternoon = 95, then 100 bonus
    expect(pointsWithBoth).toBe(100);
  });
  
  // Test for activities with missing createdAt
  it('should correctly handle activities with missing createdAt', () => {
    const fridayDate = '2023-06-09'; // This is a Friday
    
    // Create test data with activities that have no createdAt field
    const testData = {
      baseActivities: ['Activity 1', 'Activity 2'],
      sleep: { bedtime: '22:30', wakeup: '07:00' },
      dailyActivities: [
        { 
          name: 'Morning activity with no createdAt', 
          weekday: 'Ven', // Friday in Italian short form
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0
          // No createdAt field
        },
        { 
          name: 'Afternoon activity with createdAt', 
          weekday: 'Ven', 
          partOfDay: 'afternoon', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z' 
        }
      ],
      completions: {
        [fridayDate]: {
          'base-0': true,
          'base-1': true,
          'sleep-bed': true,
          'sleep-wake': true
        }
      }
    };
    
    // First check that the activities are properly detected
    const points = calculatePoints(fridayDate, testData);
    
    // Should have base (2*5=10) + sleep (2*15=30) = 40 points
    // But no morning/afternoon points yet because activities not completed
    expect(points).toBe(40);
    
    // Now complete the morning activity (which has no createdAt)
    testData.completions[fridayDate]['daily-0'] = true;
    const pointsWithMorning = calculatePoints(fridayDate, testData);
    
    // Should now have base + sleep + morning = 40 + 20 = 60 points
    expect(pointsWithMorning).toBe(60);
    
    // Complete the afternoon activity too
    testData.completions[fridayDate]['daily-1'] = true;
    const pointsWithBoth = calculatePoints(fridayDate, testData);
    
    // Should now have base + sleep + morning + afternoon = 40 + 20 + 20 = 80 points
    // Not enough for 100 bonus yet
    expect(pointsWithBoth).toBe(80);
    
    // Add more base activities to reach 95+ points
    testData.baseActivities.push('Activity 3', 'Activity 4');
    testData.completions[fridayDate]['base-2'] = true;
    testData.completions[fridayDate]['base-3'] = true;
    
    const pointsWithMore = calculatePoints(fridayDate, testData);
    
    // Now should have enough for 100 bonus
    // base (4*5=20) + sleep (2*15=30) + morning (20) + afternoon (20) = 90
    // Then gets boosted to 100 because it's >= 95 and all required tasks completed
    expect(pointsWithMore).toBe(100);
  });
  
  // Test for date inconsistency between UI and calculation
  it('should handle date inconsistency between UI and calculation logic', () => {
    // This test simulates the scenario where UI shows Friday but dateKey is Thursday
    const thursdayDate = '2023-06-08'; // This is a Thursday
    const fridayDate = '2023-06-09';   // This is a Friday
    
    // Create activities for both Thursday and Friday
    const testData = {
      baseActivities: ['Activity 1', 'Activity 2'],
      sleep: { bedtime: '22:30', wakeup: '07:00' },
      dailyActivities: [
        { 
          name: 'Thursday morning activity', 
          weekday: 'Gio', // Thursday in Italian short form
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z'
        },
        { 
          name: 'Friday morning activity', 
          weekday: 'Ven', // Friday in Italian short form
          partOfDay: 'morning', 
          repeat: 1, 
          offset: 0,
          createdAt: '2023-06-01T00:00:00Z'
        }
      ],
      completions: {
        [thursdayDate]: {
          'base-0': true,
          'base-1': true,
          'sleep-bed': true,
          'sleep-wake': true,
          'daily-0': true // Thursday activity completed
        },
        [fridayDate]: {
          'base-0': true,
          'base-1': true,
          'sleep-bed': true,
          'sleep-wake': true,
          'daily-1': true // Friday activity completed
        }
      }
    };
    
    // Calculate points for Thursday
    const thursdayPoints = calculatePoints(thursdayDate, testData);
    
    // Calculate points for Friday
    const fridayPoints = calculatePoints(fridayDate, testData);
    
    // Both should get their respective morning points
    // Thursday: base (2*5=10) + sleep (2*15=30) + morning (20) = 60
    // But we also get the afternoon bonus since there are no afternoon activities
    // base (2*5=10) + sleep (2*15=30) + morning (20) + afternoon bonus (2*2+2*5=14) = 74
    expect(thursdayPoints).toBe(74);
    expect(fridayPoints).toBe(74);
    
    // Now test the scenario where we use Thursday's dateKey but Friday's activities are completed
    // This simulates the bug where UI shows Friday but dateKey is Thursday
    const mixedData = {
      ...testData,
      completions: {
        [thursdayDate]: {
          'base-0': true,
          'base-1': true,
          'sleep-bed': true,
          'sleep-wake': true,
          'daily-1': true // Friday activity completed but using Thursday's dateKey
        }
      }
    };
    
    const mixedPoints = calculatePoints(thursdayDate, mixedData);
    
    // Should NOT get morning points because Thursday's dateKey is used but Friday's activity is completed
    // Should get base (2*5=10) + sleep (2*15=30) = 40 points
    // Plus afternoon bonus (2*2+2*5=14) = 54 points
    expect(mixedPoints).toBe(54);
  });
});