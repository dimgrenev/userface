import { UserFace } from './types';

// Utility functions

export const generateId = (prefix: string = 'user'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Additional utility functions can be added here
export const validateUserFace = (face: any): face is UserFace => {
  return face && typeof face === 'object' && 
         typeof face.id === 'string' && 
         typeof face.component === 'string';
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
}; 