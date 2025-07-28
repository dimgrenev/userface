import React from 'react';
import { engine } from '../core/engine';
import { UserRenderer } from '../core/render-react';

// Тестовые компоненты
const TestButton: React.FC<{ text?: string; onClick?: () => void }> = ({ 
  text = 'Test Button', 
  onClick 
}) => (
  <button 
    style={{ 
      padding: '8px 16px', 
      background: '#007AFF', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px',
      cursor: 'pointer'
    }}
    onClick={onClick}
  >
    {text}
  </button>
);

const TestCard: React.FC<{ title?: string; content?: string }> = ({ 
  title = 'Test Card', 
  content = 'This is a test card content' 
}) => (
  <div style={{ 
    padding: '16px', 
    border: '1px solid #ddd', 
    borderRadius: '8px', 
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}>
    <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{title}</h3>
    <p style={{ margin: 0, color: '#666' }}>{content}</p>
  </div>
);

const SimpleTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<{
    adapters: any[];
    components: Record<string, any>;
    schemas: any[];
  }>({
    adapters: [],
    components: {},
    schemas: []
  });

  React.useEffect(() => {
    // Регистрируем компоненты
    engine.registerComponent('test-button', TestButton);
    engine.registerComponent('test-card', TestCard);
    
    // Получаем данные
    const adapters = engine.getAllAdapters();
    const components = engine.getAllComponents();
    const schemas = engine.getAllSchemas();

    setTestResults({
      adapters,
      components,
      schemas
    });
  }, []);

  const handleButtonClick = () => {
    alert('Button clicked from UserRenderer!');
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Simple Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Engine Status:</h3>
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <p><strong>Available Adapters:</strong> {testResults.adapters.map(a => a.id).join(', ')}</p>
          <p><strong>Registered Components:</strong> {Object.keys(testResults.components).length}</p>
          <p><strong>Total Schemas:</strong> {testResults.schemas.length}</p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Direct Component Rendering:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <TestButton text="Direct Button" onClick={() => alert('Direct button clicked!')} />
          <TestCard title="Direct Card" content="This is rendered directly" />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>UserRenderer Rendering:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <UserRenderer face={{ 
            component: 'test-button', 
            text: 'UserRenderer Button',
            onClick: handleButtonClick
          }} />
          <UserRenderer face={{ 
            component: 'test-card', 
            title: 'UserRenderer Card',
            content: 'This is rendered via UserRenderer'
          }} />
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
    </div>
  );
};

export default SimpleTest; 