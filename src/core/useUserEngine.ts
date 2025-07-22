import { useContext } from 'react';
import { userEngine } from './UserEngine';
import { UserContext } from './UserContext';

export const useUserEngine = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserEngine must be used within a UserComponent');
  }
  return {
    engine: userEngine,
    face: context.face,
  };
}; 