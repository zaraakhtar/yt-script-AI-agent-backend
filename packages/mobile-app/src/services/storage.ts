import AsyncStorage from '@react-native-async-storage/async-storage';
import { Job } from '../../src/types';

const HISTORY_KEY = 'GUEST_SCRIPT_HISTORY';

/**
 * Retrieves the list of jobs saved locally for a guest user.
 */
export async function getHistory(): Promise<Job[]> {
  try {
    const historyJson = await AsyncStorage.getItem(HISTORY_KEY);
    if (!historyJson) {
      return []; // No history found
    }
    // Parse the JSON and correctly convert date strings back into Date objects
    const history = JSON.parse(historyJson);
    return history.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
    }));
  } catch (e) {
    console.error('Failed to load local history', e);
    return [];
  }
}

/**
 * Saves a completed or failed job to the local history for a guest user.
 * It will update an existing job or add a new one.
 */
export async function saveScriptToLocalHistory(job: Job) {
  try {
    const history = await getHistory();
    const existingIndex = history.findIndex(item => item.id === job.id);
    
    if (existingIndex > -1) {
      // Update the existing job in the history
      history[existingIndex] = job;
    } else {
      // Add the new job to the beginning of the list
      history.unshift(job);
    }
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save script locally', e);
  }
}