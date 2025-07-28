import React from 'react';
import { engine } from '../core/engine';
import { UserRenderer } from '../core/render-react';

// Тестовые компоненты
const SimpleButton: React.FC = () => (
  <button style={{ padding: '8px 16px', background: '#007AFF', color: 'white', border: 'none', borderRadius: '4px' }}>
    Simple Button
  </button>
);

const ProppedButton: React.FC<{ text?: string; disabled?: boolean; onClick?: () => void }> = ({ 
  text = 'Propped Button', 
  disabled = false, 
  onClick 
}) => (
  <button 
    style={{ 
      padding: '8px 16px', 
      background: disabled ? '#ccc' : '#007AFF', 
      color: 'white', 
      border: 'none', 
      borderRadius: '4px',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }}
    disabled={disabled}
    onClick={onClick}
  >
    {text}
  </button>
);

const AutoAnalysisTest: React.FC = () => {
  const [analysisResults, setAnalysisResults] = React.useState<{
    simpleSchema: any;
    proppedSchema: any;
    allSchemas: any[];
    reactSchemas: any[];
  }>({
    simpleSchema: null,
    proppedSchema: null,
    allSchemas: [],
    reactSchemas: []
  });

  React.useEffect(() => {
    // Регистрируем компоненты
    const simpleSchema = engine.registerComponent('simple-button', SimpleButton);
    const proppedSchema = engine.registerComponent('propped-button', ProppedButton);
    
    // Получаем все схемы
    const allSchemas = engine.getAllSchemas();
    const reactSchemas = engine.getSchemasByPlatform('react');

    setAnalysisResults({
      simpleSchema,
      proppedSchema,
      allSchemas,
      reactSchemas
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 Auto Analysis Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Component Analysis:</h3>
        <p><strong>Total schemas:</strong> {analysisResults.allSchemas.length}</p>
        <p><strong>React schemas:</strong> {analysisResults.reactSchemas.length}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Simple Button Schema:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(analysisResults.simpleSchema, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Propped Button Schema:</h3>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(analysisResults.proppedSchema, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rendered Components:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <UserRenderer face={{ component: 'simple-button' }} />
          <UserRenderer face={{ 
            component: 'propped-button', 
            text: 'Custom Text',
            disabled: false 
          }} />
          <UserRenderer face={{ 
            component: 'propped-button', 
            text: 'Disabled Button',
            disabled: true 
          }} />
        </div>
      </div>
    </div>
  );
};

export default AutoAnalysisTest; 