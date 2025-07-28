import React from 'react';
import { engine } from '../core/engine';
import { UserRenderer } from '../core/render-react';

// Тестовые компоненты с универсальными типами
const UniversalButton: React.FC<{
  text?: string;
  color?: string;
  dimension?: string;
  onClick?: () => void;
}> = ({ text = 'Universal Button', color = '#007AFF', dimension = 'auto', onClick }) => (
  <button 
    style={{ 
      color: color,
      width: dimension,
      padding: '10px 20px',
      border: '1px solid #ccc',
      borderRadius: '4px',
      cursor: 'pointer',
      background: 'white'
    }}
    onClick={onClick}
  >
    {text}
  </button>
);

const UniversalCard: React.FC<{
  title?: string;
  content?: string;
  meta?: {
    className?: string;
    theme?: string;
    style?: Record<string, any>;
  };
}> = ({ title = 'Universal Card', content = 'Card content', meta = {} }) => {
  const cardStyle = {
    padding: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    background: meta.theme === 'dark' ? '#333' : 'white',
    color: meta.theme === 'dark' ? 'white' : '#333',
    ...meta.style
  };

  return (
    <div className={meta.className} style={cardStyle}>
      <h3 style={{ margin: '0 0 8px 0' }}>{title}</h3>
      <p style={{ margin: 0 }}>{content}</p>
    </div>
  );
};

const UniversalTypesTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<{
    components: Record<string, any>;
    schemas: any[];
  }>({
    components: {},
    schemas: []
  });

  React.useEffect(() => {
    // Регистрируем компоненты
    engine.registerComponent('universal-button', UniversalButton);
    engine.registerComponent('universal-card', UniversalCard);
    
    // Получаем данные
    const components = engine.getAllComponents();
    const schemas = engine.getAllSchemas();

    setTestResults({
      components,
      schemas
    });
  }, []);

  const handleClick = () => {
    alert('Universal button clicked!');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🌐 Universal Types Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Engine Status:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <p><strong>Registered Components:</strong> {Object.keys(testResults.components).length}</p>
          <p><strong>Total Schemas:</strong> {testResults.schemas.length}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Universal Types Examples:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          <div>
            <h4>Button with Universal Types:</h4>
            <UserRenderer face={{ 
              component: 'universal-button', 
              text: 'Custom Text',
              color: '#ff0000',
              dimension: '200px',
              onClick: handleClick
            }} />
          </div>
          
          <div>
            <h4>Card with Meta:</h4>
            <UserRenderer face={{ 
              component: 'universal-card', 
              title: 'Meta Card',
              content: 'Card with metadata',
              meta: {
                className: 'custom-card',
                theme: 'dark',
                style: { borderColor: '#007AFF' }
              }
            }} />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Component Schemas:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {testResults.schemas.map((schema, index) => (
            <div key={index} style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              <h4>{schema.name}:</h4>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify(schema.props.map((p: any) => ({ name: p.name, type: p.type, required: p.required })), null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Universal Types Documentation:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <h4>Supported Universal Types:</h4>
          <ul>
            <li><strong>text:</strong> string - текстовые данные</li>
            <li><strong>number:</strong> number - числовые значения</li>
            <li><strong>boolean:</strong> boolean - логические значения</li>
            <li><strong>array:</strong> any[] - массивы данных</li>
            <li><strong>object:</strong> Record&lt;string, any&gt; - объекты</li>
            <li><strong>function:</strong> (...args: any[]) =&gt; any - функции</li>
            <li><strong>element:</strong> any - React элементы</li>
            <li><strong>color:</strong> string - цвета (hex, rgb, названия)</li>
            <li><strong>dimension:</strong> string - размеры (px, em, rem, %)</li>
            <li><strong>resource:</strong> string - ресурсы (URL, пути)</li>
          </ul>
          
          <h4>Meta Object:</h4>
          <ul>
            <li><strong>className:</strong> string - CSS классы</li>
            <li><strong>theme:</strong> string - тема компонента</li>
            <li><strong>style:</strong> Record&lt;string, any&gt; - inline стили</li>
            <li><strong>responsive:</strong> Record&lt;string, any&gt; - адаптивные свойства</li>
            <li><strong>accessibility:</strong> Record&lt;string, any&gt; - доступность</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UniversalTypesTest; 