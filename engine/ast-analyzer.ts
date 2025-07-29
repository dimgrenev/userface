import * as ts from 'typescript';
import { Schema, PropDefinition, EventDefinition } from './schema';
import { Type } from './types';

export interface ASTAnalysisResult {
  name: string;
  platform: string;
  props: PropDefinition[];
  events: EventDefinition[];
  interfaces: string[];
  types: string[];
  hasChildren: boolean;
}

export class ASTAnalyzer {
  private program: ts.Program | null = null;
  private checker: ts.TypeChecker | null = null;

  analyzeCode(sourceCode: string, fileName: string = 'component.tsx'): ASTAnalysisResult {
    // Создаем TypeScript программу
    const compilerHost = ts.createCompilerHost({
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      skipLibCheck: true
    });

    // Создаем виртуальный файл
    const sourceFile = ts.createSourceFile(
      fileName,
      sourceCode,
      ts.ScriptTarget.ES2020,
      true,
      ts.ScriptKind.TSX
    );

    // Создаем программу
    this.program = ts.createProgram([fileName], {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: false,
      skipLibCheck: true
    }, compilerHost);

    this.checker = this.program.getTypeChecker();

    // Анализируем AST
    const result = this.analyzeAST(sourceFile);

    return result;
  }

  private analyzeAST(sourceFile: ts.SourceFile): ASTAnalysisResult {
    const result: ASTAnalysisResult = {
      name: '',
      platform: 'unknown',
      props: [],
      events: [],
      interfaces: [],
      types: [],
      hasChildren: false
    };

    // Определяем платформу
    result.platform = this.detectPlatform(sourceFile);

    // Анализируем интерфейсы и типы
    this.analyzeInterfaces(sourceFile, result);

    // Анализируем компоненты
    this.analyzeComponents(sourceFile, result);

    // Анализируем события
    this.analyzeEvents(sourceFile, result);

    return result;
  }

  private detectPlatform(sourceFile: ts.SourceFile): string {
    const text = sourceFile.getText();

    // React Native
    if (text.includes('TouchableOpacity') || text.includes('onPress') || 
        text.includes('StyleSheet') || text.includes('Platform.OS') ||
        text.includes('View') || text.includes('Text') ||
        text.includes('Image') || text.includes('ScrollView')) {
      return 'react-native';
    }

    // React
    if (text.includes('React.FC') || text.includes('React.Component') || 
        text.includes('useState') || text.includes('useEffect') ||
        text.includes('JSX.Element')) {
      return 'react';
    }

    // Vue
    if (text.includes('defineComponent') || text.includes('setup()') ||
        text.includes('Vue.component')) {
      return 'vue';
    }

    // Angular
    if (text.includes('@Component') || text.includes('selector:')) {
      return 'angular';
    }

    // Svelte
    if (text.includes('$$render') || text.includes('svelte')) {
      return 'svelte';
    }

    return 'vanilla';
  }

  private analyzeInterfaces(sourceFile: ts.SourceFile, result: ASTAnalysisResult): void {
    const visit = (node: ts.Node) => {
      if (ts.isInterfaceDeclaration(node)) {
        result.interfaces.push(node.name.text);
        this.analyzeInterfaceProps(node, result);
      } else if (ts.isTypeAliasDeclaration(node)) {
        result.types.push(node.name.text);
        this.analyzeTypeAliasProps(node, result);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private analyzeInterfaceProps(interfaceNode: ts.InterfaceDeclaration, result: ASTAnalysisResult): void {
    interfaceNode.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        const propName = member.name.getText();
        const propType = this.getTypeFromNode(member.type);
        const isOptional = member.questionToken !== undefined;

        result.props.push({
          name: propName,
          type: this.mapTypeScriptType(propType),
          required: !isOptional,
          description: `Interface prop: ${propName}`,
          defaultValue: undefined
        });
      }
    });
  }

  private analyzeTypeAliasProps(typeNode: ts.TypeAliasDeclaration, result: ASTAnalysisResult): void {
    if (ts.isTypeLiteralNode(typeNode.type)) {
      typeNode.type.members.forEach(member => {
        if (ts.isPropertySignature(member) && member.name) {
          const propName = member.name.getText();
          const propType = this.getTypeFromNode(member.type);
          const isOptional = member.questionToken !== undefined;

          result.props.push({
            name: propName,
            type: this.mapTypeScriptType(propType),
            required: !isOptional,
            description: `Type prop: ${propName}`,
            defaultValue: undefined
          });
        }
      });
    }
  }

  private analyzeComponents(sourceFile: ts.SourceFile, result: ASTAnalysisResult): void {
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        this.analyzeComponentProps(node, result);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  private analyzeComponentProps(node: ts.Node, result: ASTAnalysisResult): void {
    // Анализируем параметры функции компонента
    if (ts.isFunctionDeclaration(node) && node.parameters.length > 0) {
      const firstParam = node.parameters[0];
      if (ts.isObjectBindingPattern(firstParam.name)) {
        this.analyzeDestructuringPattern(firstParam.name, result);
      }
    }

    // Анализируем переменные с деструктуризацией
    if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach(declaration => {
        if (ts.isObjectBindingPattern(declaration.name)) {
          this.analyzeDestructuringPattern(declaration.name, result);
        }
      });
    }
  }

  private analyzeDestructuringPattern(pattern: ts.ObjectBindingPattern, result: ASTAnalysisResult): void {
    pattern.elements.forEach(element => {
      if (ts.isBindingElement(element) && element.propertyName) {
        const propName = element.propertyName.getText();
        
        // Проверяем, не добавлен ли уже этот проп
        if (!result.props.find(p => p.name === propName)) {
          result.props.push({
            name: propName,
            type: 'text', // По умолчанию
            required: false,
            description: `Destructured prop: ${propName}`,
            defaultValue: undefined
          });
        }
      }
    });
  }

  private analyzeEvents(sourceFile: ts.SourceFile, result: ASTAnalysisResult): void {
    const text = sourceFile.getText();
    
    // Ищем события в коде
    const eventPatterns = [
      /on[A-Z]\w+/g, // onClick, onChange, etc.
      /onPress|onLongPress|onLayout|onScroll|onFocus|onBlur|onSubmitEditing|onEndEditing/g // React Native
    ];

    const foundEvents = new Set<string>();

    eventPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(event => foundEvents.add(event));
      }
    });

    // Добавляем события в результат
    foundEvents.forEach(eventName => {
      result.events.push({
        name: eventName,
        parameters: ['event'],
        description: `${eventName} event`
      });
    });

    // Если событий не найдено, добавляем стандартные
    if (result.events.length === 0) {
      result.events.push(
        { name: 'onClick', parameters: ['event'], description: 'Click event' },
        { name: 'onChange', parameters: ['value'], description: 'Change event' }
      );
    }
  }

  private getTypeFromNode(typeNode: ts.TypeNode | undefined): string {
    if (!typeNode) return 'any';

    if (ts.isTypeReferenceNode(typeNode)) {
      return typeNode.typeName.getText();
    } else if (ts.isUnionTypeNode(typeNode)) {
      return typeNode.types.map(t => this.getTypeFromNode(t)).join(' | ');
    } else if (ts.isArrayTypeNode(typeNode)) {
      return `${this.getTypeFromNode(typeNode.elementType)}[]`;
    } else if (ts.isLiteralTypeNode(typeNode)) {
      return typeNode.literal.getText();
    } else if (ts.isParenthesizedTypeNode(typeNode)) {
      return this.getTypeFromNode(typeNode.type);
    }

    return typeNode.getText();
  }

  private mapTypeScriptType(type: string): Type {
    const cleanType = type.toLowerCase().trim();
    
    // Базовые типы
    if (cleanType.includes('string')) return 'text';
    if (cleanType.includes('number')) return 'number';
    if (cleanType.includes('boolean')) return 'boolean';
    if (cleanType.includes('function')) return 'function';
    if (cleanType.includes('array') || cleanType.includes('[]')) return 'array';
    if (cleanType.includes('object')) return 'object';
    
    // React типы
    if (cleanType.includes('react.node') || cleanType.includes('jsx.element')) return 'element';
    if (cleanType.includes('event')) return 'function';
    
    // React Native типы
    if (cleanType.includes('styleprop') || cleanType.includes('viewstyle') || cleanType.includes('textstyle')) return 'object';
    if (cleanType.includes('imagesourceproptype')) return 'resource';
    if (cleanType.includes('colorvalue')) return 'color';
    if (cleanType.includes('dimensions')) return 'dimension';
    
    return 'text';
  }
}

// Экспортируем синглтон
export const astAnalyzer = new ASTAnalyzer(); 