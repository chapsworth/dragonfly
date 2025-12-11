import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Loader2, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(
    window.PublicKeyCredential !== undefined
  );

  const registerBiometric = async (user, deviceName = 'Default Device') => {
    if (!isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    try {
      // Create challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: window.location.hostname,
            id: window.location.hostname
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email,
            displayName: user.full_name
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      // Save credential to user profile
      const credentialData = {
        credential_id: arrayBufferToBase64(credential.rawId),
        public_key: arrayBufferToBase64(credential.response.getPublicKey()),
        counter: 0,
        device_name: deviceName,
        created_date: new Date().toISOString()
      };

      const existingCredentials = user.biometric_credentials || [];
      await base44.auth.updateMe({
        biometric_credentials: [...existingCredentials, credentialData],
        biometric_enabled: true
      });

      return true;
    } catch (error) {
      console.error('Biometric registration error:', error);
      throw error;
    }
  };

  const authenticateBiometric = async (user) => {
    if (!isSupported) {
      throw new Error('Biometric authentication is not supported on this device');
    }

    if (!user.biometric_enabled || !user.biometric_credentials?.length) {
      throw new Error('Biometric authentication is not set up');
    }

    try {
      // Create challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Get credential IDs
      const allowCredentials = user.biometric_credentials.map(cred => ({
        type: 'public-key',
        id: base64ToArrayBuffer(cred.credential_id)
      }));

      // Authenticate
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: allowCredentials,
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (!assertion) {
        throw new Error('Authentication failed');
      }

      // Store successful auth in session
      sessionStorage.setItem('biometric_authenticated', Date.now().toString());
      sessionStorage.setItem('biometric_user_id', user.id);

      return true;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      throw error;
    }
  };

  const isBiometricAuthenticated = (user) => {
    const authTime = sessionStorage.getItem('biometric_authenticated');
    const authUserId = sessionStorage.getItem('biometric_user_id');
    
    if (!authTime || !authUserId || authUserId !== user.id) {
      return false;
    }

    // Session expires after 1 hour
    const oneHour = 60 * 60 * 1000;
    return Date.now() - parseInt(authTime) < oneHour;
  };

  const clearBiometricSession = () => {
    sessionStorage.removeItem('biometric_authenticated');
    sessionStorage.removeItem('biometric_user_id');
  };

  return {
    isSupported,
    registerBiometric,
    authenticateBiometric,
    isBiometricAuthenticated,
    clearBiometricSession
  };
}

export function BiometricSetupDialog({ isOpen, onClose, user }) {
  const [deviceName, setDeviceName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const { registerBiometric, isSupported } = useBiometricAuth();

  const handleSetup = async () => {
    setIsRegistering(true);
    try {
      await registerBiometric(user, deviceName || 'My Device');
      toast.success('Biometric authentication enabled!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to setup biometric authentication');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Not Supported
            </DialogTitle>
            <DialogDescription>
              Biometric authentication is not supported on this device or browser.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-emerald-500" />
            Setup Biometric Authentication
          </DialogTitle>
          <DialogDescription>
            Enable Face ID, Touch ID, or fingerprint authentication for secure access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label>Device Name (Optional)</Label>
            <Input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., iPhone, MacBook"
              className="border-emerald-200"
            />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-emerald-700 space-y-1">
              <li>• You'll be prompted to verify your identity</li>
              <li>• Use Face ID, Touch ID, or your device's fingerprint sensor</li>
              <li>• Your biometric data stays on your device (never stored online)</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button 
              onClick={handleSetup}
              disabled={isRegistering}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-2" />
                  Enable Biometric Auth
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BiometricPrompt({ onAuthenticated, onCancel }) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [user, setUser] = useState(null);
  const { authenticateBiometric, isSupported } = useBiometricAuth();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleAuthenticate = async () => {
    if (!user) return;
    
    setIsAuthenticating(true);
    try {
      await authenticateBiometric(user);
      toast.success('Authentication successful!');
      onAuthenticated();
    } catch (error) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-red-200 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Supported</h2>
          <p className="text-gray-600 mb-6">
            Biometric authentication is not supported on this device.
          </p>
          <Button onClick={onCancel} variant="outline">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md text-center">
        <div className="bg-gradient-to-br from-emerald-100 to-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-emerald-900 mb-2">Secure Access Required</h2>
        <p className="text-emerald-600 mb-8">
          Verify your identity to access the CRM
        </p>

        <Button
          onClick={handleAuthenticate}
          disabled={isAuthenticating || !user}
          className="w-full bg-gradient-to-r from-emerald-500 to-green-500 h-12 text-lg mb-4"
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="w-5 h-5 mr-2" />
              Authenticate with Biometrics
            </>
          )}
        </Button>

        <Button onClick={onCancel} variant="outline" className="w-full">
          Cancel
        </Button>
      </div>
    </div>
  );
}