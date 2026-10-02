import React from 'react';
import { SetupAdminForm } from './SetupAdminForm';
import type { AuthSession } from '../../types/auth';

interface RegisterRestaurantFormProps {
  onSuccess: (session: AuthSession) => void;
}

export const RegisterRestaurantForm: React.FC<RegisterRestaurantFormProps> = ({ onSuccess }) => {
  return <SetupAdminForm onSuccess={onSuccess} />;
};
