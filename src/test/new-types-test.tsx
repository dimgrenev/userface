import React from 'react';
import { unifiedRegistry as engine } from '../core/registry';
import { UserRenderer } from '../core/render-react';

// Тестовые компоненты с универсальными типами
const TextComponent: React.FC<{ text?: string }> = ({ text = 'Default Text' }) => (
  <div style={{ padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
    {text}
  </div>
);

const NumberComponent: React.FC<{ number?: number }> = ({ number = 42 }) => (
  <div style={{ padding: '10px', background: '#f3e5f5', borderRadius: '4px' }}>
    Number: {number}
  </div>
);

const BooleanComponent: React.FC<{ boolean?: boolean }> = ({ boolean = true }) => (
  <div style={{ padding: '10px', background: '#e8f5e8', borderRadius: '4px' }}>
    Boolean: {boolean ? '✅' : '❌'}
  </div>
);

const ArrayComponent: React.FC<{ array?: any[] }> = ({ array = ['item1', 'item2'] }) => (
  <div style={{ padding: '10px', background: '#fff3e0', borderRadius: '4px' }}>
    Array: {array.join(', ')}
  </div>
);

const ObjectComponent: React.FC<{ object?: Record<string, any> }> = ({ object = { key: 'value' } }) => (
  <div style={{ padding: '10px', background: '#fce4ec', borderRadius: '4px' }}>
    Object: {JSON.stringify(object)}
  </div>
);

const FunctionComponent: React.FC<{ function?: (...args: any[]) => any }> = ({ function: func }) => (
  <div style={{ padding: '10px', background: '#e0f2f1', borderRadius: '4px' }}>
    <button onClick={() => func && func('clicked!')}>
      Call Function
    </button>
  </div>
);

const ElementComponent: React.FC<{ element?: any }> = ({ element }) => (
  <div style={{ padding: '10px', background: '#f1f8e9', borderRadius: '4px' }}>
    {element || 'No element provided'}
  </div>
);

const NewTypesTest: React.FC = () => {
  const [schemas, setSchemas] = React.useState<{
    textSchema: any;
    numberSchema: any;
    booleanSchema: any;
    arraySchema: any;
    objectSchema: any;
    functionSchema: any;
    elementSchema: any;
    allSchemas: any[];
  }>({
    textSchema: null,
    numberSchema: null,
    booleanSchema: null,
    arraySchema: null,
    objectSchema: null,
    functionSchema: null,
    elementSchema: null,
    allSchemas: []
  });

  React.useEffect(() => {
    // Регистрируем компоненты
    const textSchema = engine.registerComponent('text-component', TextComponent);
    const numberSchema = engine.registerComponent('number-component', NumberComponent);
    const booleanSchema = engine.registerComponent('boolean-component', BooleanComponent);
    const arraySchema = engine.registerComponent('array-component', ArrayComponent);
    const objectSchema = engine.registerComponent('object-component', ObjectComponent);
    const functionSchema = engine.registerComponent('function-component', FunctionComponent);
    const elementSchema = engine.registerComponent('element-component', ElementComponent);
    
    // Получаем все схемы
    const allSchemas = engine.getAllSchemas();

    setSchemas({
      textSchema,
      numberSchema,
      booleanSchema,
      arraySchema,
      objectSchema,
      functionSchema,
      elementSchema,
      allSchemas
    });
  }, []);

  const handleFunctionCall = (message: string) => {
    alert(`Function called with: ${message}`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🎯 New Types Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Universal Types Support:</h3>
        <p><strong>Total schemas:</strong> {schemas.allSchemas.length}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Component Schemas:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
          {schemas.textSchema && (
            <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
              <h4>Text Component:</h4>
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                {JSON.stringify({
                  name: schemas.textSchema.name,
                  props: schemas.textSchema.props.map((p: any) => ({ name: p.name, type: p.type }))
                }, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rendered Components:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <UserRenderer face={{ 
            component: 'text-component', 
            text: 'Custom text value' 
          }} />
          
          <UserRenderer face={{ 
            component: 'number-component', 
            number: 123 
          }} />
          
          <UserRenderer face={{ 
            component: 'boolean-component', 
            boolean: true 
          }} />
          
          <UserRenderer face={{ 
            component: 'array-component', 
            array: ['apple', 'banana', 'cherry'] 
          }} />
          
          <UserRenderer face={{ 
            component: 'object-component', 
            object: { name: 'John', age: 30 } 
          }} />
          
          <UserRenderer face={{ 
            component: 'function-component', 
            function: handleFunctionCall 
          }} />
          
          <UserRenderer face={{ 
            component: 'element-component', 
            element: <span style={{ color: 'red' }}>Custom Element</span> 
          }} />
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

export default NewTypesTest; 