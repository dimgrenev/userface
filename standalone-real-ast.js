/**
 * Полностью изолированный настоящий AST-анализатор
 * Работает без зависимостей от основного проекта userface
 */

// Импортируем TypeScript напрямую
const ts = require('typescript');

console.log('[STANDALONE-REAL-AST] Standalone real AST analyzer loaded');
console.log('[STANDALONE-REAL-AST] TypeScript version:', ts.version);

class StandaloneRealASTAnalyzer {
  constructor() {
    console.log('[STANDALONE-REAL-AST] StandaloneRealASTAnalyzer constructed');
  }

  analyzeComponent(component, name) {
    console.log('[STANDALONE-REAL-AST] analyzeComponent called', { name, component });

    try {
      if (typeof component === 'object' && component.code) {
        return this.analyzeCodeString(component.code, name);
      }
      return this.analyzeComponentObject(component, name);
    } catch (error) {
      console.error('[STANDALONE-REAL-AST] Error in analyzeComponent:', error);
      return {
        name,
        detectedPlatform: 'universal',
        props: [],
        events: [],
        children: false,
        description: `Component ${name} (fallback)`
      };
    }
  }

  analyzeCodeString(code, name) {
    console.log('[STANDALONE-REAL-AST] analyzeCodeString called', { name, codeLength: code.length });

    try {
      // Создаем SourceFile с правильными настройками
      const sourceFile = ts.createSourceFile(
        `temp-${name}.tsx`,
        code,
        ts.ScriptTarget.ES2020,
        true, // setParentNodes
        ts.ScriptKind.TSX
      );

      const props = [];
      const events = [];

      // Анализируем AST
      this.visitNode(sourceFile, props, events, name);

      // Определяем платформу
      const platform = this.detectPlatform(sourceFile, code);

      // Проверяем поддержку children
      const children = this.detectChildrenSupport(sourceFile);

      // Дедуплицируем пропсы
      const uniqueProps = this.deduplicateProps(props);

      return {
        name,
        detectedPlatform: platform,
        props: uniqueProps,
        events,
        children,
        description: `Component ${name} (analyzed from real AST)`
      };
    } catch (error) {
      console.error('[STANDALONE-REAL-AST] Error in analyzeCodeString:', error);
      throw error;
    }
  }

  visitNode(node, props, events, componentName) {
    // Анализируем интерфейсы
    if (ts.isInterfaceDeclaration(node)) {
      this.analyzeInterface(node, props, events);
    }

    // Анализируем типы
    if (ts.isTypeAliasDeclaration(node)) {
      this.analyzeTypeAlias(node, props, events);
    }

    // Анализируем функции/компоненты
    if (ts.isFunctionDeclaration(node)) {
      this.analyzeFunction(node, props, events, componentName);
    }

    // Анализируем переменные (const/let компоненты)
    if (ts.isVariableStatement(node)) {
      this.analyzeVariableStatement(node, props, events, componentName);
    }

    // Анализируем стрелочные функции
    if (ts.isArrowFunction(node)) {
      this.analyzeArrowFunction(node, props, events, componentName);
    }

    // Анализируем JSX элементы
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      this.analyzeJSXElement(node, events);
    }

    // Рекурсивно обходим дочерние узлы
    ts.forEachChild(node, (child) => {
      this.visitNode(child, props, events, componentName);
    });
  }

  analyzeInterface(node, props, events) {
    const interfaceName = node.name.text;
    console.log('[STANDALONE-REAL-AST] Analyzing interface:', interfaceName);

    node.members.forEach(member => {
      if (ts.isPropertySignature(member)) {
        const propName = member.name.getText();
        const propType = member.type ? member.type.getText() : 'any';
        const isOptional = member.questionToken !== undefined;

        props.push({
          name: propName,
          type: this.mapTypeScriptType(propType),
          required: !isOptional,
          interface: interfaceName,
          originalType: propType
        });

        // Проверяем, является ли это событием
        if (propName.startsWith('on') && propName.length > 2) {
          events.push({
            name: propName,
            type: 'function',
            handler: propType,
            interface: interfaceName
          });
        }
      }
    });
  }

  analyzeTypeAlias(node, props, events) {
    const typeName = node.name.text;
    console.log('[STANDALONE-REAL-AST] Analyzing type alias:', typeName);

    if (ts.isTypeLiteralNode(node.type)) {
      node.type.members.forEach(member => {
        if (ts.isPropertySignature(member)) {
          const propName = member.name.getText();
          const propType = member.type ? member.type.getText() : 'any';
          const isOptional = member.questionToken !== undefined;

          props.push({
            name: propName,
            type: this.mapTypeScriptType(propType),
            required: !isOptional,
            typeName: typeName,
            originalType: propType
          });

          // Проверяем, является ли это событием
          if (propName.startsWith('on') && propName.length > 2) {
            events.push({
              name: propName,
              type: 'function',
              handler: propType,
              typeName: typeName
            });
          }
        }
      });
    }
  }

  analyzeFunction(node, props, events, componentName) {
    if (!node.name || !node.name.text.includes(componentName)) return;

    console.log('[STANDALONE-REAL-AST] Analyzing function:', node.name.text);

    if (node.parameters) {
      node.parameters.forEach(param => {
        if (ts.isParameter(param)) {
          const paramName = param.name.getText();
          const paramType = param.type ? param.type.getText() : 'any';
          const isOptional = param.questionToken !== undefined;

          props.push({
            name: paramName,
            type: this.mapTypeScriptType(paramType),
            required: !isOptional,
            function: node.name?.text,
            originalType: paramType
          });
        }
      });
    }
  }

  analyzeVariableStatement(node, props, events, componentName) {
    node.declarationList.declarations.forEach(declaration => {
      if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
        const varName = declaration.name.getText();
        
        if (varName.includes(componentName) || varName === componentName) {
          console.log('[STANDALONE-REAL-AST] Analyzing variable:', varName);
          
          if (ts.isArrowFunction(declaration.initializer)) {
            this.analyzeArrowFunction(declaration.initializer, props, events, componentName);
          } else if (ts.isFunctionExpression(declaration.initializer)) {
            this.analyzeFunctionExpression(declaration.initializer, props, events, componentName);
          }
        }
      }
    });
  }

  analyzeArrowFunction(node, props, events, componentName) {
    console.log('[STANDALONE-REAL-AST] Analyzing arrow function');

    node.parameters.forEach(param => {
      if (ts.isParameter(param)) {
        const paramName = param.name.getText();
        const paramType = param.type ? param.type.getText() : 'any';
        const isOptional = param.questionToken !== undefined;

        props.push({
          name: paramName,
          type: this.mapTypeScriptType(paramType),
          required: !isOptional,
          function: 'arrow',
          originalType: paramType
        });
      }
    });
  }

  analyzeFunctionExpression(node, props, events, componentName) {
    console.log('[STANDALONE-REAL-AST] Analyzing function expression');

    node.parameters.forEach(param => {
      if (ts.isParameter(param)) {
        const paramName = param.name.getText();
        const paramType = param.type ? param.type.getText() : 'any';
        const isOptional = param.questionToken !== undefined;

        props.push({
          name: paramName,
          type: this.mapTypeScriptType(paramType),
          required: !isOptional,
          function: 'expression',
          originalType: paramType
        });
      }
    });
  }

  analyzeJSXElement(node, events) {
    const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
    
    attributes.properties.forEach(attr => {
      if (ts.isJsxAttribute(attr)) {
        const attrName = ts.isIdentifier(attr.name) ? attr.name.text : attr.name.getText();
        
        if (attrName.startsWith('on') && attrName.length > 2) {
          events.push({
            name: attrName,
            type: 'jsx-event',
            handler: attr.initializer ? attr.initializer.getText() : '{}'
          });
        }
      }
    });
  }

  detectPlatform(sourceFile, code) {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('react') || lowerCode.includes('jsx') || lowerCode.includes('tsx')) {
      return 'react';
    }
    if (lowerCode.includes('vue') || lowerCode.includes('vuex') || lowerCode.includes('nuxt')) {
      return 'vue';
    }
    if (lowerCode.includes('angular') || lowerCode.includes('@angular')) {
      return 'angular';
    }
    if (lowerCode.includes('svelte')) {
      return 'svelte';
    }
    if (lowerCode.includes('vanilla') || lowerCode.includes('native')) {
      return 'vanilla';
    }

    return 'universal';
  }

  detectChildrenSupport(sourceFile) {
    let hasChildren = false;
    
    const checkNode = (node) => {
      if (ts.isIdentifier(node) && node.text === 'children') {
        hasChildren = true;
      }
      ts.forEachChild(node, checkNode);
    };
    
    checkNode(sourceFile);
    return hasChildren;
  }

  deduplicateProps(props) {
    const uniqueProps = new Map();

    props.forEach(prop => {
      const key = prop.name;
      if (!uniqueProps.has(key)) {
        uniqueProps.set(key, prop);
      } else {
        // Объединяем типы если нужно
        const existing = uniqueProps.get(key);
        if (existing.type !== prop.type) {
          existing.type = this.mergeTypes(existing.type, prop.type);
        }
      }
    });

    return Array.from(uniqueProps.values());
  }

  mergeTypes(type1, type2) {
    if (type1 === type2) return type1;
    return 'object';
  }

  mapTypeScriptType(typeString) {
    const lowerType = typeString.toLowerCase();

    if (lowerType.includes('string')) return 'text';
    if (lowerType.includes('number')) return 'number';
    if (lowerType.includes('boolean')) return 'boolean';
    if (lowerType.includes('array') || lowerType.includes('[]')) return 'array';
    if (lowerType.includes('object')) return 'object';
    if (lowerType.includes('function') || lowerType.includes('=>')) return 'function';
    if (lowerType.includes('void') || lowerType.includes('undefined')) return 'text';
    if (lowerType.includes('null')) return 'text';

    return 'text';
  }

  analyzeComponentObject(component, name) {
    return {
      name,
      detectedPlatform: 'universal',
      props: [],
      events: [],
      children: false,
      description: `Component ${name} (object fallback)`
    };
  }
}

// Создаем и экспортируем экземпляр
const standaloneRealASTAnalyzer = new StandaloneRealASTAnalyzer();

// Экспортируем для Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { standaloneRealASTAnalyzer };
} else if (typeof window !== 'undefined') {
  window.standaloneRealASTAnalyzer = standaloneRealASTAnalyzer;
}

console.log('[STANDALONE-REAL-AST] Standalone real AST analyzer loaded successfully'); 