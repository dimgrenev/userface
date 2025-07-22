import React from 'react';
import { userEngine } from './UserEngine';
import { UserRendererProps } from './generated-types';

export const UserRenderer = ({ face }: UserRendererProps) => {
  const { component, ...props } = face;
  
  // Получаем компонент из реестра
  const Component = userEngine.getComponent(component);
  
  if (!Component) {
    console.warn(`[UserRenderer] Component "${component}" not found`);
    return React.createElement('div', null, `Component "${component}" not found`);
  }
  
  // Рендерим компонент с пропсами из спека
  return React.createElement(Component, props);
};

export default UserRenderer; 