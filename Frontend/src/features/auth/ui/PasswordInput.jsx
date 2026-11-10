import React from 'react';
import { usePasswordInput } from '../model/usePasswordInput.js';

export function PasswordInput({ id, value, onChange, ...inputProps }) {
  const { inputError, handlers } = usePasswordInput({ value, onChange });
  const errorId = `${id}-character-error`;
  const description = [inputProps['aria-describedby'], inputError ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <>
      <input
        {...inputProps}
        {...handlers}
        id={id}
        value={value}
        type="password"
        aria-invalid={Boolean(inputError) || inputProps['aria-invalid']}
        aria-describedby={description}
      />
      {inputError && <p id={errorId} role="status" className="text-xs leading-5 text-brand-danger-600 mt-1.5">{inputError}</p>}
    </>
  );
}
