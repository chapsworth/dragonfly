import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useBiometricAuth, BiometricPrompt, BiometricSetupDialog } from './BiometricAuth';
import { Button } from "@/components/ui/button";
import { Shield, Fingerprint, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BiometricGuard({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const navigate = useNavigate();
  
  const { isBiometricAuthenticated, isSupported } = useBiometricAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Check if biometric is enabled
      if (!currentUser.biometric_enabled) {
        // First time - show setup
        setShowSetup(true);
        setIsLoading(false);
        return;
      }

      // Check if already authenticated in this session
      if (isBiometricAuthenticated(currentUser)) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Need to authenticate
      setShowPrompt(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate(createPageUrl('Home'));
    }
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    // After setup, prompt for first authentication
    const updatedUser = await base44.auth.me();
    setUser(updatedUser);
    setShowPrompt(true);
  };

  const handleAuthSuccess = () => {
    setShowPrompt(false);
    setIsAuthenticated(true);
  };

  const handleCancel = () => {
    navigate(createPageUrl('Home'));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-emerald-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show setup dialog for first-time users
  if (showSetup && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md text-center">
          <div className="bg-gradient-to-br from-emerald-100 to-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">Secure Your CRM</h2>
          <p className="text-emerald-600 mb-6">
            Enable biometric authentication for secure access to sensitive customer data
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-left">
            <h4 className="font-semibold text-emerald-900 mb-2">Why enable this?</h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>✓ Protect sensitive customer information</li>
              <li>✓ Quick and secure access with Face ID/Touch ID</li>
              <li>✓ Prevent unauthorized access</li>
              <li>✓ Industry-standard security</li>
            </ul>
          </div>

          <Button
            onClick={() => setShowSetup(true)}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 h-12 text-lg mb-3"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            Setup Biometric Auth
          </Button>

          <Button onClick={handleCancel} variant="outline" className="w-full">
            Maybe Later
          </Button>
        </div>

        <BiometricSetupDialog
          isOpen={showSetup}
          onClose={handleSetupComplete}
          user={user}
        />
      </div>
    );
  }

  // Show authentication prompt
  if (showPrompt) {
    return (
      <BiometricPrompt
        onAuthenticated={handleAuthSuccess}
        onCancel={handleCancel}
      />
    );
  }

  // Authenticated - show content
  if (isAuthenticated) {
    return children;
  }

  return null;
}