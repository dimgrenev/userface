import { Schema } from './schema';
import { Type } from './types';

console.log('[AST-DEBUG] analyzer.ts loaded');

export const componentAnalyzer = {
  analyzeComponent: (component: any, name: string) => {
    console.log('[AST-DEBUG] STUB analyzeComponent called', { name, component });
    return {
      name,
      platform: 'stub',
      props: [],
      events: [],
      children: false,
      description: 'stub',
    };
  }
};
console.log('[AST-DEBUG] componentAnalyzer STUB exported', componentAnalyzer); 