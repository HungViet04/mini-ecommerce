/**
 * SearchBar Component
 * Search input with live search suggestions
 */
import React, { useState, useEffect, useRef } from 'react';
import { productService } from '../../services';

export function SearchBar({ onSearch, placeholder = 'Bạn cần tìm gì...' }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await productService.search(query.trim());
        const items = Array.isArray(results) ? results : results.items || [];
        setSuggestions(items.slice(0, 6)); // Limit to 6 suggestions
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearch(query.trim());
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (value === '') {
      onSearch('');
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    onSearch(product.name);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && suggestions.length > 0 && setShowSuggestions(true)}
        />
        <button type="submit" className="search-button">
          {loading ? '⏳' : '🔍'}
        </button>
      </form>

      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          <div className="search-suggestions-list">
            {suggestions.map((product, index) => (
              <div
                key={product.id}
                className={`search-suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectSuggestion(product)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="suggestion-image">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} />
                  ) : (
                    <span className="suggestion-placeholder">📦</span>
                  )}
                </div>
                <div className="suggestion-info">
                  <span className="suggestion-name">{product.name}</span>
                  <span className="suggestion-price">{formatPrice(product.price)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="search-suggestion-footer" onClick={handleSubmit}>
            Xem tất cả kết quả cho "{query}"
          </div>
        </div>
      )}

      {showSuggestions && query.trim() && suggestions.length === 0 && !loading && (
        <div className="search-suggestions">
          <div className="search-no-results">
            Không tìm thấy sản phẩm nào
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
