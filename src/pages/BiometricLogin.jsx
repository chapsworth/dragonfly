import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Loader2, Mail, Lock, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function BiometricLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkBiometricSupport();
    checkExistingUser();
  }, []);

  const checkBiometricSupport = async () => {
    if (window.PublicKeyCredential) {
      setIsSupported(true);
    }
  };

  const checkExistingUser = async () => {
    try {
      const user = await base44.auth.me();
      if (user) {
        navigate(createPageUrl('Home'));
      }
    } catch {
      // Not logged in
    }
  };

  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await base44.auth.login(email, password);
      toast.success('Logged in successfully!');
      navigate(createPageUrl('Home'));
    } catch (error) {
      toast.error('Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsBiometricLoading(true);
    try {
      // Get stored credentials
      const storedCreds = localStorage.getItem('biometric_credentials');
      if (!storedCreds) {
        toast.error('No biometric credentials found. Please log in traditionally first.');
        return;
      }

      const { email: userEmail, credentialId } = JSON.parse(storedCreds);

      // Request biometric authentication
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
            type: 'public-key'
          }],
          timeout: 60000,
          userVerification: 'required'
        }
      });

      if (!credential) {
        toast.error('Biometric authentication failed');
        return;
      }

      // Call backend to verify and log in
      const response = await base44.functions.invoke('biometricLogin', {
        email: userEmail,
        credentialId
      });

      if (response.data.success) {
        toast.success('Logged in with Face ID!');
        navigate(createPageUrl('Home'));
      } else {
        toast.error('Authentication failed');
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      toast.error('Biometric authentication failed');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-center text-emerald-600 mb-8">
            Sign in to continue to Dragonfly
          </p>

          {/* Biometric Login Button */}
          {isSupported && (
            <Button
              onClick={handleBiometricLogin}
              disabled={isBiometricLoading}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-lg mb-6 shadow-lg hover:shadow-xl transition-all"
            >
              {isBiometricLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="w-5 h-5 mr-2" />
                  Sign in with Face ID
                </>
              )}
            </Button>
          )}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-emerald-500">Or sign in with email</span>
            </div>
          </div>

          {/* Traditional Login Form */}
          <form onSubmit={handleTraditionalLogin} className="space-y-4">
            <div>
              <Label className="text-emerald-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10 h-12 border-emerald-200 focus:border-emerald-400"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-emerald-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 h-12 border-emerald-200 focus:border-emerald-400"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Info */}
          {isSupported && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs text-emerald-700 text-center">
                💡 After logging in with email, you can set up Face ID for quick access next time
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}