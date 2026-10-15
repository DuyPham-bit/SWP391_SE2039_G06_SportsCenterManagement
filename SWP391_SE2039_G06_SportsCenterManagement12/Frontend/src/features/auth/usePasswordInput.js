import { useEffect, useState } from 'react';
import { isAsciiPassword, PASSWORD_ASCII_PATTERN, PASSWORD_CHARACTER_ERROR } from '../../services/passwordPolicy.js';

export function usePasswordInput({ value, onChange, enabled = true }) {
  const [inputError, setInputError] = useState('');

  useEffect(() => { setInputError(''); }, [value]);

  const rejectInput = (event) => {
    event.preventDefault();
    setInputError(PASSWORD_CHARACTER_ERROR);
  };

  const handlers = enabled ? {
    pattern: PASSWORD_ASCII_PATTERN,
    autoCapitalize: 'none',
    autoCorrect: 'off',
    spellCheck: false,
    onBeforeInput: (event) => {
      const inserted = event.data ?? event.nativeEvent?.data;
      if (inserted && !isAsciiPassword(inserted)) rejectInput(event);
    },
    onPaste: (event) => {
      if (!isAsciiPassword(event.clipboardData.getData('text'))) rejectInput(event);
    },
    onChange: (event) => {
      if (!isAsciiPassword(event.target.value)) {
        event.target.value = value ?? '';
        setInputError(PASSWORD_CHARACTER_ERROR);
        return;
      }
      setInputError('');
      onChange?.(event);
    },
    onCompositionEnd: (event) => {
      if (!isAsciiPassword(event.currentTarget.value)) {
        event.currentTarget.value = value ?? '';
        setInputError(PASSWORD_CHARACTER_ERROR);
      }
    }
  } : { onChange };

  return { inputError, handlers };
}
