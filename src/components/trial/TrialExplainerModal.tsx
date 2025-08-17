import React from 'react';

interface TrialExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
  primaryYear: string;
}

const TrialExplainerModal: React.FC<TrialExplainerModalProps> = ({
  isOpen,
  onClose,
  daysRemaining,
  primaryYear
}) => {
  // Always hide trial explainer to remove trial gating
  return null;
};

export default TrialExplainerModal;