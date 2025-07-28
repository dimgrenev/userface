import React from 'react';

export const ExampleButton = ({ text, onClick }) => (
  <button onClick={onClick} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
    {text}
  </button>
);

export const ExampleInput = ({ value, onChange, placeholder }) => (
  <input 
    value={value} 
    onChange={onChange} 
    placeholder={placeholder}
    style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
  />
);
