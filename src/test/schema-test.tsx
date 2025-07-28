import React from 'react';
import { engine } from '../core/engine';
import { UserRenderer } from '../core/render-react';

// Тестовый компонент с полной схемой
const MyButton: React.FC<{
  text: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}> = ({ 
  text, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  onClick 
}) => {
  const getStyles = () => {
    const baseStyles = {
      border: 'none',
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: '500',
      transition: 'all 0.2s'
    };

    const variantStyles = {
      primary: { background: '#007AFF', color: 'white' },
      secondary: { background: '#6C757D', color: 'white' },
      danger: { background: '#DC3545', color: 'white' }
    };

    const sizeStyles = {
      small: { padding: '6px 12px', fontSize: '12px' },
      medium: { padding: '8px 16px', fontSize: '14px' },
      large: { padding: '12px 24px', fontSize: '16px' }
    };

    return {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      opacity: disabled ? 0.6 : 1
    };
  };

  return (
    <button 
      style={getStyles()} 
      disabled={disabled}
      onClick={onClick}
    >
      {text}
    </button>
  );
};

const SchemaTest: React.FC = () => {
  const [schemas, setSchemas] = React.useState<{
    buttonSchema: any;
    allSchemas: any[];
    reactSchemas: any[];
  }>({
    buttonSchema: null,
    allSchemas: [],
    reactSchemas: []
  });

  React.useEffect(() => {
    // Регистрируем компонент
    const buttonSchema = engine.registerComponent('my-button', MyButton);
    
    // Получаем все схемы
    const allSchemas = engine.getAllSchemas();
    const reactSchemas = engine.getSchemasByPlatform('react');

    setSchemas({
      buttonSchema,
      allSchemas,
      reactSchemas
    });
  }, []);

  // Удаляем неиспользуемую функцию

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>📋 Schema Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Schema Analysis:</h3>
        <p><strong>Total schemas:</strong> {schemas.allSchemas.length}</p>
        <p><strong>React schemas:</strong> {schemas.reactSchemas.length}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Button Component Schema:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(schemas.buttonSchema, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rendered Components:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Primary Button',
            variant: 'primary',
            size: 'medium'
          }} />
          
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Secondary Button',
            variant: 'secondary',
            size: 'medium'
          }} />
          
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Danger Button',
            variant: 'danger',
            size: 'medium'
          }} />
          
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Small Button',
            variant: 'primary',
            size: 'small'
          }} />
          
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Large Button',
            variant: 'primary',
            size: 'large'
          }} />
          
          <UserRenderer face={{ 
            component: 'my-button', 
            text: 'Disabled Button',
            variant: 'primary',
            size: 'medium',
            disabled: true
          }} />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Schema Validation:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <p><strong>Required props:</strong> {schemas.buttonSchema?.props?.filter((p: any) => p.required).map((p: any) => p.name).join(', ') || 'None'}</p>
          <p><strong>Optional props:</strong> {schemas.buttonSchema?.props?.filter((p: any) => !p.required).map((p: any) => p.name).join(', ') || 'None'}</p>
          <p><strong>Total props:</strong> {schemas.buttonSchema?.props?.length || 0}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>All Registered Schemas:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
          {schemas.allSchemas.map((schema, index) => (
            <div key={index} style={{ marginBottom: '10px', padding: '5px', background: 'white', borderRadius: '2px' }}>
              <strong>{schema.name}:</strong>
              <pre style={{ fontSize: '10px', margin: '5px 0 0 0' }}>
                {JSON.stringify(schema.props.map((p: any) => ({ name: p.name, type: p.type, required: p.required })), null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SchemaTest; 