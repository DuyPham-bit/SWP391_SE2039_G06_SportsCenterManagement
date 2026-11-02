import React from 'react';
import CloudMediaPickerModal from './CloudMediaPickerModal.jsx';

/**
 * Standardized MediaPicker component for feature-first architecture.
 */
export function MediaPicker(props) {
  return <CloudMediaPickerModal {...props} />;
}

export default MediaPicker;

