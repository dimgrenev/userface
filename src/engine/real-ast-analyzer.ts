import * as ts from 'typescript';
import { Schema } from './schema';
import { Type } from './types';

console.log('[REAL-AST] Real AST analyzer loaded');

export class RealASTAnalyzer {
  private compilerOptions: ts.CompilerOptions;

  constructor() {
    console.log('[REAL-AST] RealASTAnalyzer constructed');
    this.compilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      allowJs: true,
      resolveJsonModule: true
    };
  }

  analyzeComponent(component: any, name: string): Schema {
    console.log('[REAL-AST] analyzeComponent called', { name, component });

    try {
      if (typeof component === 'object' && component.code) {
        return this.analyzeCodeString(component.code, name);
      }
      return this.analyzeComponentObject(component, name);
    } catch (error) {
      console.error('[REAL-AST] Error in analyzeComponent:', error);
      return {
        name,
        detectedPlatform: 'universal' as Type,
        props: [],
        events: [],
        children: false,
        description: `Component ${name} (fallback)`
      };
    }
  }

  analyzeCodeString(code: string, name: string): Schema {
    console.log('[REAL-AST] analyzeCodeString called', { name, codeLength: code.length });

    try {
      const sourceFile = ts.createSourceFile(
        `temp-${name}.tsx`,
        code,
        ts.ScriptTarget.ES2020,
        true,
        ts.ScriptKind.TSX
      );

      const props: any[] = [];
      const events: any[] = [];

      this.visitNode(sourceFile, props, events, name);

      const platform = this.detectPlatform(sourceFile, code);
      const children = this.detectChildrenSupport(sourceFile);
      const uniqueProps = this.deduplicateProps(props);

      return {
        name,
        detectedPlatform: platform as Type,
        props: uniqueProps,
        events,
        children,
        description: `Component ${name} (analyzed from real AST)`
      };
    } catch (error) {
      console.error('[REAL-AST] Error in analyzeCodeString:', error);
      throw error;
    }
  }

  visitNode(node: ts.Node, props: any[], events: any[], componentName: string) {
    if (ts.isInterfaceDeclaration(node)) {
      this.analyzeInterface(node, props, events);
    }

    if (ts.isTypeAliasDeclaration(node)) {
      this.analyzeTypeAlias(node, props, events);
    }

    if (ts.isFunctionDeclaration(node)) {
      this.analyzeFunction(node, props, events, componentName);
    }

    if (ts.isVariableStatement(node)) {
      this.analyzeVariableStatement(node, props, events, componentName);
    }

    if (ts.isArrowFunction(node)) {
      this.analyzeArrowFunction(node, props, events, componentName);
    }

    if (ts.isFunctionExpression(node)) {
      this.analyzeFunctionExpression(node, props, events, componentName);
    }

    if (ts.isJsxElement(node)) {
      this.analyzeJSXElement(node, events);
    }

    ts.forEachChild(node, (child) => this.visitNode(child, props, events, componentName));
  }

  analyzeInterface(node: ts.InterfaceDeclaration, props: any[], events: any[]) {
    node.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
        const type = member.type ? this.mapTypeScriptType(member.type.getText()) : 'text';
        const required = !member.questionToken;

        props.push({
          name: propName,
          type,
          required,
          description: `Interface prop: ${propName}`
        });
      }
    });
  }

  analyzeTypeAlias(node: ts.TypeAliasDeclaration, props: any[], events: any[]) {
    if (ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = ts.isIdentifier(member.name) ? member.name.text : member.name.getText();
          const type = member.type ? this.mapTypeScriptType(member.type.getText()) : 'text';
          const required = !member.questionToken;

          props.push({
            name: propName,
            type,
            required,
            description: `Type prop: ${propName}`
          });
        }
      });
    }
  }

  analyzeFunction(node: ts.FunctionDeclaration, props: any[], events: any[], componentName: string) {
    if (node.name?.text === componentName && node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isObjectBindingPattern(firstParam.name)) {
        firstParam.name.elements.forEach(element => {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            const propName = element.name.text;
            const required = !element.dotDotDotToken;
            const type = element.propertyName ? 'text' : 'text';

            props.push({
              name: propName,
              type,
              required,
              description: `Function prop: ${propName}`
            });
          }
        });
      }
    }
  }

  analyzeVariableStatement(node: ts.VariableStatement, props: any[], events: any[], componentName: string) {
    node.declarationList.declarations.forEach(declaration => {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === componentName) {
        if (declaration.initializer && ts.isArrowFunction(declaration.initializer)) {
          this.analyzeArrowFunction(declaration.initializer, props, events, componentName);
        }
      }
    });
  }

  analyzeArrowFunction(node: ts.ArrowFunction, props: any[], events: any[], componentName: string) {
    if (node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isObjectBindingPattern(firstParam.name)) {
        firstParam.name.elements.forEach(element => {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            const propName = element.name.text;
            const required = !element.dotDotDotToken;
            const type = element.propertyName ? 'text' : 'text';

            props.push({
              name: propName,
              type,
              required,
              description: `Arrow function prop: ${propName}`
            });
          }
        });
      }
    }
  }

  analyzeFunctionExpression(node: ts.FunctionExpression, props: any[], events: any[], componentName: string) {
    if (node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isObjectBindingPattern(firstParam.name)) {
        firstParam.name.elements.forEach(element => {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            const propName = element.name.text;
            const required = !element.dotDotDotToken;
            const type = element.propertyName ? 'text' : 'text';

            props.push({
              name: propName,
              type,
              required,
              description: `Function expression prop: ${propName}`
            });
          }
        });
      }
    }
  }

  analyzeJSXElement(node: ts.JsxElement, events: any[]) {
    node.openingElement.attributes.properties.forEach(attr => {
      if (ts.isJsxAttribute(attr) && attr.name) {
        const attrName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();
        if (attrName.startsWith('on') && attrName.length > 2) {
          events.push({
            name: attrName,
            parameters: [],
            description: `${attrName} event`
          });
        }
      }
    });
  }

  detectPlatform(sourceFile: ts.SourceFile, code: string): string {
    if (code.includes('React.FC') || code.includes('useState') || code.includes('useEffect')) {
      return 'react';
    }
    if (code.includes('@Component') || code.includes('@Input') || code.includes('@Output')) {
      return 'angular';
    }
    if (code.includes('defineComponent') || code.includes('ref(') || code.includes('computed(')) {
      return 'vue';
    }
    if (code.includes('svelte') || code.includes('$:') || code.includes('{#if}')) {
      return 'svelte';
    }
    return 'universal';
  }

  detectChildrenSupport(sourceFile: ts.SourceFile): boolean {
    let hasChildren = false;
    const checkNode = (node: ts.Node) => {
      if (ts.isJsxElement(node) && node.children.length > 0) {
        hasChildren = true;
      }
      ts.forEachChild(node, checkNode);
    };
    checkNode(sourceFile);
    return hasChildren;
  }

  deduplicateProps(props: any[]): any[] {
    const seen = new Set();
    return props.filter(prop => {
      const key = prop.name;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  mapTypeScriptType(typeString: string): string {
    const lowerType = typeString.toLowerCase();
    if (lowerType.includes('string')) return 'text';
    if (lowerType.includes('number')) return 'number';
    if (lowerType.includes('boolean')) return 'boolean';
    if (lowerType.includes('array') || lowerType.includes('[]')) return 'array';
    if (lowerType.includes('object') || lowerType.includes('{}')) return 'object';
    if (lowerType.includes('function') || lowerType.includes('=>')) return 'function';
    return 'text';
  }

  analyzeComponentObject(component: any, name: string): Schema {
    return {
      name,
      detectedPlatform: 'universal' as Type,
      props: [],
      events: [],
      children: false,
      description: `Component ${name} (object fallback)`
    };
  }
}

export const realASTAnalyzer = new RealASTAnalyzer(); 