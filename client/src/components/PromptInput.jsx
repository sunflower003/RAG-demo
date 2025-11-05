// client/src/components/PromptInput.jsx
import React, { useState } from 'react';

function PromptInput({ onSubmit, isLoading }) {
  const [query, setQuery] = useState('');

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmitForm} className="prompt-input-form">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hỏi tôi về một loại đồ uống..."
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '...' : 'Gửi'}
      </button>
    </form>
  );
}

export default PromptInput; 