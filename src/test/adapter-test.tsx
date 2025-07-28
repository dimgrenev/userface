import React from 'react';
import { engine } from '../core/engine';
import { UserRenderer } from '../core/render-react';

const AdapterTest: React.FC = () => {
  const [testResults, setTestResults] = React.useState<{
    adapters: any[];
    registration: boolean;
    rendering: boolean;
  }>({
    adapters: [],
    registration: false,
    rendering: false
  });

  React.useEffect(() => {
    // Тестируем получение адаптеров
    const adapters = engine.getAllAdapters();
    
    // Тестируем регистрацию компонента
    let registrationSuccess = false;
    try {
      const TestComponent = () => <div>Test Component</div>;
      engine.registerComponent('test-component', TestComponent);
      registrationSuccess = true;
    } catch (error) {
      console.error('Registration failed:', error);
    }

    // Тестируем рендеринг
    let renderingSuccess = false;
    try {
      const spec = {
        component: 'test-component',
        text: 'Hello from adapter test'
      };
      const result = engine.renderWithAdapter(spec, 'react');
      renderingSuccess = !!result;
    } catch (error) {
      console.error('Rendering failed:', error);
    }

    setTestResults({
      adapters,
      registration: registrationSuccess,
      rendering: renderingSuccess
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Adapter Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Available Adapters:</h3>
        <ul>
          {testResults.adapters.map((adapter, index) => (
            <li key={index}>
              <strong>{adapter.id}</strong> - {adapter.meta?.name || 'Unknown'}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results:</h3>
        <p><strong>Component Registration:</strong> {testResults.registration ? '✅' : '❌'}</p>
        <p><strong>Component Rendering:</strong> {testResults.rendering ? '✅' : '❌'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rendered Component:</h3>
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '4px' }}>
          <UserRenderer 
            face={{
              component: 'test-component',
              text: 'Hello from adapter test'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdapterTest; 