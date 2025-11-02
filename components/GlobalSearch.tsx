import React, { useState } from 'react';
import { SearchIcon } from './icons';

// This is a placeholder component.
// In a real application, this would take search handlers and data sources as props.
const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <SearchIcon className="w-5 h-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder="Recherche globale..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-10 pr-4 py-2 text-sm text-gray-700 bg-gray-100 border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
      />
    </div>
  );
};

export default GlobalSearch;
