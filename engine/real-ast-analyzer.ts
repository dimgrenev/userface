import * as ts from 'typescript';
import { Schema, PropDefinition, EventDefinition } from './schema';
import { Platform, Type } from './types';
import { PropGenerator } from './prop-generator';

export interface ComponentInfo {
  name: string;
  code: string;
}

export interface AnalysisResult extends Schema {
  // Дополнительные поля для совместимости
  platform?: Platform;
}

export class RealASTAnalyzer {
  private program: ts.Program | null = null;
  private sourceFile: ts.SourceFile | null = null;

  /**
   * Анализирует компонент и возвращает его схему
   */
  async analyzeComponent(component: ComponentInfo, componentName: string): Promise<AnalysisResult> {
    try {
      console.log(`[AST-DEBUG] Analyzing component: ${componentName}`);
      
      // Создаем программу TypeScript
      this.program = ts.createProgram([`${componentName}.tsx`], {
        target: ts.ScriptTarget.Latest,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: false,
        skipLibCheck: true
      }, {
        getSourceFile: (fileName: string) => {
          if (fileName.endsWith('.tsx')) {
            return ts.createSourceFile(fileName, component.code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
          }
          return undefined;
        },
        writeFile: () => {},
        getCurrentDirectory: () => process.cwd(),
        getDirectories: () => [],
        fileExists: (fileName: string) => fileName.endsWith('.tsx'),
        readFile: (fileName: string) => fileName.endsWith('.tsx') ? component.code : undefined,
        getDefaultLibFileName: () => 'lib.d.ts',
        getCanonicalFileName: (fileName: string) => fileName,
        useCaseSensitiveFileNames: () => false,
        getNewLine: () => '\n'
      });

      const sourceFile = this.program.getSourceFile(`${componentName}.tsx`);
      this.sourceFile = sourceFile || null;
      
      if (!this.sourceFile) {
        throw new Error('Failed to create source file');
      }

      // Анализируем компонент
      const schema: Schema = {
        name: componentName,
        detectedPlatform: this.detectPlatform(component.code),
        props: [],
        events: [],
        children: false,
        description: '',
        supportsChildren: false
      };

      // Обходим AST
      this.visitNode(this.sourceFile, schema);

      // Убираем дубликаты пропсов
      schema.props = this.deduplicateProps(schema.props);

      console.log(`[AST-DEBUG] Analysis complete for ${componentName}:`, schema);
      
      return {
        ...schema,
        platform: schema.detectedPlatform // Для обратной совместимости
      };

    } catch (error) {
      console.error(`[AST-DEBUG] Error analyzing component ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Генерирует пропсы для компонента на основе его анализа
   */
  generatePropsForComponent(component: ComponentInfo, componentName: string): any {
    try {
      // Сначала анализируем компонент
      return this.analyzeComponent(component, componentName).then(schema => {
        // Затем генерируем пропсы на основе схемы
        return PropGenerator.generateProps(schema, componentName);
      });
    } catch (error) {
      console.error(`[AST-DEBUG] Error generating props for ${componentName}:`, error);
      // Возвращаем дефолтные пропсы если анализ не удался
      return PropGenerator.generateDefaultProps(componentName);
    }
  }

  private visitNode(node: ts.Node, schema: Schema): void {
    switch (node.kind) {
      case ts.SyntaxKind.InterfaceDeclaration:
        this.analyzeInterface(node as ts.InterfaceDeclaration, schema);
        break;
      case ts.SyntaxKind.TypeAliasDeclaration:
        this.analyzeTypeAlias(node as ts.TypeAliasDeclaration, schema);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
        this.analyzeFunction(node as ts.FunctionDeclaration, schema);
        break;
      case ts.SyntaxKind.VariableStatement:
        this.analyzeVariableStatement(node as ts.VariableStatement, schema);
        break;
      case ts.SyntaxKind.ArrowFunction:
        this.analyzeArrowFunction(node as ts.ArrowFunction, schema);
        break;
      case ts.SyntaxKind.FunctionExpression:
        this.analyzeFunctionExpression(node as ts.FunctionExpression, schema);
        break;
      case ts.SyntaxKind.JsxElement:
        this.analyzeJSXElement(node as ts.JsxElement, schema);
        break;
      case ts.SyntaxKind.JsxSelfClosingElement:
        this.analyzeJSXSelfClosingElement(node as ts.JsxSelfClosingElement, schema);
        break;
    }

    // Рекурсивно обходим дочерние узлы
    ts.forEachChild(node, (child) => this.visitNode(child, schema));
  }

  private analyzeInterface(interfaceDecl: ts.InterfaceDeclaration, schema: Schema): void {
    const interfaceName = interfaceDecl.name.text;
    
    // Проверяем, является ли это интерфейсом пропсов
    if (interfaceName.includes('Props') || interfaceName.includes('props')) {
      interfaceDecl.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
          const propName = member.name.getText();
          const propType = member.type ? member.type.getText() : 'any';
          const isRequired = !member.questionToken;
          
          schema.props.push({
            name: propName,
            type: this.mapTypeScriptType(propType),
            required: isRequired,
            description: member.getText()
          });
        } else if (ts.isMethodSignature(member)) {
          const methodName = member.name.getText();
          if (methodName.startsWith('on')) {
            schema.events.push({
              name: methodName,
              parameters: member.parameters.map(p => p.getText()),
              description: member.getText()
            });
          }
        }
      });
    }
  }

  private analyzeTypeAlias(typeAlias: ts.TypeAliasDeclaration, schema: Schema): void {
    const typeName = typeAlias.name.text;
    
    if (typeName.includes('Props') || typeName.includes('props')) {
      if (ts.isTypeLiteralNode(typeAlias.type)) {
        typeAlias.type.members.forEach(member => {
          if (ts.isPropertySignature(member)) {
            const propName = member.name.getText();
            const propType = member.type ? member.type.getText() : 'any';
            const isRequired = !member.questionToken;
            
            schema.props.push({
              name: propName,
              type: this.mapTypeScriptType(propType),
              required: isRequired,
              description: member.getText()
            });
          } else if (ts.isMethodSignature(member)) {
            const methodName = member.name.getText();
            if (methodName.startsWith('on')) {
              schema.events.push({
                name: methodName,
                parameters: member.parameters.map(p => p.getText()),
                description: member.getText()
              });
            }
          }
        });
      }
    }
  }

  private analyzeFunction(funcDecl: ts.FunctionDeclaration, schema: Schema): void {
    if (!funcDecl.name) return;
    
    const funcName = funcDecl.name.text;
    if (funcName.includes('Component') || funcName.includes('component')) {
      // Анализируем параметры функции
      funcDecl.parameters.forEach(param => {
        if (param.type) {
          const paramType = param.type.getText();
          if (paramType.includes('Props') || paramType.includes('props')) {
            // Это пропсы компонента
            schema.props.push({
              name: param.name.getText(),
              type: this.mapTypeScriptType(paramType),
              required: !param.questionToken,
              description: param.getText()
            });
          }
        }
      });
    }
  }

  private analyzeVariableStatement(varStmt: ts.VariableStatement, schema: Schema): void {
    varStmt.declarationList.declarations.forEach(decl => {
      if (decl.initializer && ts.isArrowFunction(decl.initializer)) {
        this.analyzeArrowFunction(decl.initializer, schema);
      } else if (decl.initializer && ts.isFunctionExpression(decl.initializer)) {
        this.analyzeFunctionExpression(decl.initializer, schema);
      }
    });
  }

  private analyzeArrowFunction(arrowFunc: ts.ArrowFunction, schema: Schema): void {
    // Анализируем параметры стрелочной функции
    arrowFunc.parameters.forEach(param => {
      if (param.type) {
        const paramType = param.type.getText();
        if (paramType.includes('Props') || paramType.includes('props')) {
          schema.props.push({
            name: param.name.getText(),
            type: this.mapTypeScriptType(paramType),
            required: !param.questionToken,
            description: param.getText()
          });
        }
      }
    });
  }

  private analyzeFunctionExpression(funcExpr: ts.FunctionExpression, schema: Schema): void {
    // Анализируем параметры функционального выражения
    funcExpr.parameters.forEach(param => {
      if (param.type) {
        const paramType = param.type.getText();
        if (paramType.includes('Props') || paramType.includes('props')) {
          schema.props.push({
            name: param.name.getText(),
            type: this.mapTypeScriptType(paramType),
            required: !param.questionToken,
            description: param.getText()
          });
        }
      }
    });
  }

  private analyzeJSXElement(jsxElement: ts.JsxElement, schema: Schema): void {
    // Проверяем поддержку children
    if (jsxElement.children && jsxElement.children.length > 0) {
      schema.children = true;
      schema.supportsChildren = true;
    }
    
    // Анализируем атрибуты
    this.analyzeJSXAttributes(jsxElement.openingElement.attributes, schema);
  }

  private analyzeJSXSelfClosingElement(jsxElement: ts.JsxSelfClosingElement, schema: Schema): void {
    // Анализируем атрибуты
    this.analyzeJSXAttributes(jsxElement.attributes, schema);
  }

  private analyzeJSXAttributes(attributes: ts.JsxAttributes, schema: Schema): void {
    attributes.properties.forEach(attr => {
      if (ts.isJsxAttribute(attr)) {
        const attrName = attr.name.getText();
        
        // Проверяем, является ли это событием
        if (attrName.startsWith('on')) {
          schema.events.push({
            name: attrName,
            parameters: [],
            description: attr.getText()
          });
        }
      }
    });
  }

  private detectPlatform(code: string): Platform {
    if (code.includes('React') || code.includes('react')) return 'react';
    if (code.includes('Vue') || code.includes('vue')) return 'vue';
    if (code.includes('Angular') || code.includes('angular')) return 'angular';
    if (code.includes('Svelte') || code.includes('svelte')) return 'svelte';
    if (code.includes('vanilla') || code.includes('Vanilla')) return 'vanilla';
    return 'universal';
  }

  private detectChildrenSupport(node: ts.Node): boolean {
    return ts.forEachChild(node, (child) => {
      if (ts.isJsxElement(child)) {
        return child.children && child.children.length > 0;
      }
      return false;
    }) || false;
  }

  private deduplicateProps(props: PropDefinition[]): PropDefinition[] {
    const seen = new Set<string>();
    return props.filter(prop => {
      if (seen.has(prop.name)) {
        return false;
      }
      seen.add(prop.name);
      return true;
    });
  }

  private mapTypeScriptType(tsType: string): Type {
    const typeLower = tsType.toLowerCase();
    
    if (typeLower.includes('string')) return 'text';
    if (typeLower.includes('number')) return 'number';
    if (typeLower.includes('boolean')) return 'boolean';
    if (typeLower.includes('array') || typeLower.includes('[]')) return 'array';
    if (typeLower.includes('object') || typeLower.includes('{}')) return 'object';
    if (typeLower.includes('function') || typeLower.includes('()')) return 'function';
    if (typeLower.includes('void') || typeLower.includes('undefined')) return 'text';
    if (typeLower.includes('null')) return 'text';
    if (typeLower.includes('any') || typeLower.includes('unknown')) return 'text';
    
    return 'text';
  }
}

// Экспортируем экземпляр
export const realASTAnalyzer = new RealASTAnalyzer(); 