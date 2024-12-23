import { TrainingData } from './types';
import { Logger } from '../utils/logger';

export async function validateTrainingData(data: TrainingData[]): Promise<TrainingData[]> {
  return data.filter(item => {
    const isValid = (
      item.content?.length > 0 &&
      item.metadata?.source &&
      item.metadata?.category &&
      item.metadata?.timestamp instanceof Date
    );

    if (!isValid) {
      Logger.log(`Invalid training data: ${item.id}`);
    }

    return isValid;
  });
} 