import React from 'react';

interface YearPreviewSwitcherProps {
  className?: string;
}

const YearPreviewSwitcher: React.FC<YearPreviewSwitcherProps> = ({ className = '' }) => {
  // Always hide trial preview switcher to remove gating
  return null;
};

export default YearPreviewSwitcher;