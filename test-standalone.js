console.log('=== Тест изолированного анализатора ===');

// Импортируем изолированный анализатор
const { standaloneAnalyzer } = require('./standalone-analyzer.js');

// Тестовые компоненты
const testComponents = [
  {
    name: 'ReactButton',
    code: `
import React from 'react';

interface ReactButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const ReactButton: React.FC<ReactButtonProps> = ({ 
  text, 
  onClick, 
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
    >
      {text}
    </button>
  );
};

export default ReactButton;
`
  },
  {
    name: 'VueComponent',
    code: `
<template>
  <div class="vue-component">
    <input 
      :value="value" 
      @input="handleInput"
      @blur="handleBlur"
    />
    <button @click="handleClick">
      {{ buttonText }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'VueComponent',
  props: {
    value: {
      type: String,
      required: true
    },
    buttonText: {
      type: String,
      default: 'Click me'
    }
  },
  methods: {
    handleInput(event) {
      this.$emit('input', event.target.value);
    },
    handleClick() {
      this.$emit('click');
    },
    handleBlur() {
      this.$emit('blur');
    }
  }
};
</script>
`
  },
  {
    name: 'AngularComponent',
    code: `
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-angular-component',
  template: \`
    <div class="angular-component">
      <input 
        [value]="value" 
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <button (click)="onClick()">
        {{ buttonText }}
      </button>
    </div>
  \`
})
export class AngularComponent {
  @Input() value: string = '';
  @Input() buttonText: string = 'Click me';
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() click = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();

  onInput(event: any) {
    this.valueChange.emit(event.target.value);
  }

  onClick() {
    this.click.emit();
  }

  onBlur() {
    this.blur.emit();
  }
}
`
  }
];

// Тестируем каждый компонент
testComponents.forEach((component, index) => {
  console.log(`\n--- Тест ${index + 1}: ${component.name} ---`);
  
  try {
    const result = standaloneAnalyzer.analyzeComponent(component, component.name);
    
    console.log('✅ Результат анализа:');
    console.log(`- Имя: ${result.name}`);
    console.log(`- Платформа: ${result.detectedPlatform}`);
    console.log(`- Пропсы: ${result.props.length}`);
    console.log(`- События: ${result.events.length}`);
    console.log(`- Импорты: ${result.imports.length}`);
    console.log(`- Экспорты: ${result.exports.length}`);
    
    if (result.props.length > 0) {
      console.log('\n📋 Детали пропсов:');
      result.props.forEach(prop => {
        console.log(`  - ${prop.name}: ${prop.type}${prop.required ? '' : ' (опциональный)'}`);
      });
    }
    
    if (result.events.length > 0) {
      console.log('\n🎯 Детали событий:');
      result.events.forEach(event => {
        console.log(`  - ${event.name}: ${event.type}`);
      });
    }
    
    if (result.imports.length > 0) {
      console.log('\n📥 Импорты:');
      result.imports.forEach(imp => {
        console.log(`  - ${imp}`);
      });
    }
    
    if (result.exports.length > 0) {
      console.log('\n📤 Экспорты:');
      result.exports.forEach(exp => {
        console.log(`  - ${exp}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Ошибка при анализе ${component.name}:`, error.message);
  }
});

console.log('\n=== Тест завершен ==='); 