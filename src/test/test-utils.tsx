import React from 'react';
import { render, RenderResult } from '@testing-library/react';
import { UserComponent } from '../core/UserContext';
import { userEngine } from '../core/UserEngine';
import { UserFace } from '../core/types';

export const renderWithUserEngine = (
  component: React.ReactElement,
  face?: UserFace,
): RenderResult & { engine: typeof userEngine } => {
  const renderResult = render(
    face ? (
      <UserComponent face={face}>
        {component}
      </UserComponent>
    ) : (
      component
    )
  );

  return { ...renderResult, engine: userEngine };
};

export * from '@testing-library/react';
export { renderWithUserEngine as render }; 