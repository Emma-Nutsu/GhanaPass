'use client';
import { useState, useCallback } from 'react';

/**
 * Auto-formatting Ghana Card Number input.
 * Format: GHA-XXXXXXXXX-X
 * - "GHA-" prefix is always present and read-only
 * - After 9 digits, a dash is auto-inserted
 * - User only types the numeric portion
 */
export default function GhanaCardInput({ value, onChange, ...props }) {
  const PREFIX = 'GHA-';
  
  const formatCardNumber = useCallback((raw) => {
    // Strip everything except digits from the part after 'GHA-'
    let stripped = raw.replace(/^GHA-?/i, '').replace(/[^0-9]/g, '');
    
    // Cap at 10 digits total (9 + 1)
    if (stripped.length > 10) stripped = stripped.substring(0, 10);
    
    // Build formatted string
    if (stripped.length <= 9) {
      return PREFIX + stripped;
    } else {
      return PREFIX + stripped.substring(0, 9) + '-' + stripped.substring(9);
    }
  }, []);

  const handleChange = (e) => {
    const inputVal = e.target.value;
    
    // Don't allow deleting the prefix
    if (inputVal.length < PREFIX.length) {
      onChange(PREFIX);
      return;
    }
    
    const formatted = formatCardNumber(inputVal);
    onChange(formatted);
  };

  const handleKeyDown = (e) => {
    const cursorPos = e.target.selectionStart;
    // Prevent backspace into the prefix
    if (e.key === 'Backspace' && cursorPos <= PREFIX.length) {
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    // If cursor is in the prefix area, move it to the end of prefix
    if (e.target.selectionStart < PREFIX.length) {
      e.target.setSelectionRange(PREFIX.length, PREFIX.length);
    }
  };

  const handleFocus = (e) => {
    // Ensure value starts with prefix
    if (!value || !value.startsWith(PREFIX)) {
      onChange(PREFIX);
    }
    // Move cursor after prefix if needed
    setTimeout(() => {
      if (e.target.selectionStart < PREFIX.length) {
        e.target.setSelectionRange(value?.length || PREFIX.length, value?.length || PREFIX.length);
      }
    }, 0);
  };

  // Display value — ensure prefix is always there
  const displayValue = value && value.startsWith(PREFIX) ? value : PREFIX;

  return (
    <input
      className="form-input"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onFocus={handleFocus}
      placeholder="GHA-XXXXXXXXX-X"
      maxLength={16} // GHA-XXXXXXXXX-X = 16 chars
      style={{ fontFamily: 'monospace', letterSpacing: '1px', ...props.style }}
      {...props}
    />
  );
}
