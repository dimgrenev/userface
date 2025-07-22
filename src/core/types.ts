import React from 'react';

// Base types
export interface BaseFace {
  id: string;
  component: string;
  meta?: {
    className?: string;
    visible?: boolean;
  };
  events?: Record<string, string>;
}

export type UserFace = BaseFace & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Engine types
export type ComponentLoader = () => Promise<{ default: React.ComponentType<{ spec: UserFace }> }>;
export type ComponentMap = { [type: string]: ComponentLoader };

export type EventHandler = (...args: any[]) => void;
export type EventHandlerMap = { [eventName: string]: EventHandler };

// Component types
export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

export type ButtonSpec = BaseFace & {
  type: 'button';
  button: ButtonProps;
  children?: UserFace[];
};

// Legacy type aliases for backward compatibility
export type BaseSpec = BaseFace;
export type FeldSpec = UserFace; 