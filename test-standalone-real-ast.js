console.log('=== Тест изолированного настоящего AST-анализатора ===');

// Импортируем изолированный настоящий AST-анализатор
const { standaloneRealASTAnalyzer } = require('./standalone-real-ast.js');

// Тестовые компоненты
const testComponents = [
  {
    name: 'ReactButton',
    code: `
import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ text, onClick, disabled = false, variant = 'primary' }) => {
  return (
    <button onClick={onClick} disabled={disabled} className={variant}>
      {text}
    </button>
  );
};

export default Button;
    `
  },
  {
    name: 'VueComponent',
    code: `
<template>
  <div class="card" @click="handleClick">
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <button @input="handleInput">{{ buttonText }}</button>
  </div>
</template>

<script lang="ts">
interface CardProps {
  title: string;
  description?: string;
  buttonText: string;
}

export default {
  name: 'Card',
  props: {
    title: { type: String, required: true },
    description: { type: String, required: false },
    buttonText: { type: String, required: true }
  },
  methods: {
    handleClick() {
      this.$emit('click');
    },
    handleInput(value: string) {
      this.$emit('input', value);
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

interface UserCardProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
  };
  showEmail?: boolean;
}

@Component({
  selector: 'app-user-card',
  template: \`
    <div class="user-card" (click)="onCardClick()">
      <img [src]="user.avatar || '/default-avatar.png'" alt="Avatar">
      <h3>{{ user.name }}</h3>
      <p *ngIf="showEmail">{{ user.email }}</p>
      <button (click)="onEdit()">Edit</button>
    </div>
  \`
})
export class UserCardComponent {
  @Input() user!: UserCardProps['user'];
  @Input() showEmail: boolean = false;
  @Output() cardClick = new EventEmitter<void>();
  @Output() edit = new EventEmitter<string>();

  onCardClick() {
    this.cardClick.emit();
  }

  onEdit() {
    this.edit.emit(this.user.name);
  }
}
    `
  }
];

// Тестируем каждый компонент
testComponents.forEach((component, index) => {
  console.log(`\n--- Тест ${index + 1}: ${component.name} ---`);

  try {
    const result = standaloneRealASTAnalyzer.analyzeComponent(component, component.name);

    console.log('✅ Результат анализа:');
    console.log(`- Имя: ${result.name}`);
    console.log(`- Платформа: ${result.detectedPlatform}`);
    console.log(`- Пропсы: ${result.props.length}`);
    console.log(`- События: ${result.events.length}`);
    console.log(`- Поддержка children: ${result.children}`);
    console.log(`- Описание: ${result.description}`);

    if (result.props.length > 0) {
      console.log('\n📋 Детали пропсов:');
      result.props.forEach(prop => {
        console.log(`  - ${prop.name}: ${prop.type}${prop.required ? '' : ' (опциональный)'}`);
        if (prop.interface) console.log(`    Интерфейс: ${prop.interface}`);
        if (prop.typeName) console.log(`    Тип: ${prop.typeName}`);
        if (prop.originalType) console.log(`    Оригинальный тип: ${prop.originalType}`);
      });
    }

    if (result.events.length > 0) {
      console.log('\n🎯 Детали событий:');
      result.events.forEach(event => {
        console.log(`  - ${event.name}: ${event.type}`);
        if (event.handler) console.log(`    Обработчик: ${event.handler}`);
        if (event.interface) console.log(`    Интерфейс: ${event.interface}`);
        if (event.typeName) console.log(`    Тип: ${event.typeName}`);
      });
    }

  } catch (error) {
    console.error(`❌ Ошибка при анализе ${component.name}:`, error.message);
  }
});

console.log('\n=== Тест завершен ==='); 