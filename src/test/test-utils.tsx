import React from 'react';
import { UserRenderer } from '../core/render-react';
import { UserFace } from '../core/types';

// Утилита для рендеринга компонентов в тестах
export const renderWithUserEngine = (
  face: UserFace,
  options?: {
    fallback?: React.ComponentType<any>;
    onError?: (error: string, face: any) => void;
  }
) => {
  return (
    <UserRenderer 
      face={face} 
      fallback={options?.fallback}
      onError={options?.onError}
    />
  );
}; 