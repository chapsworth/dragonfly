import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, Loader2, Mail, Lock, Leaf, UserPlus, Chrome } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleGoogleSignIn = () => {
    // Base44 Google OAuth - redirects to Google sign-in
    window.location.href = `${window.location.origin}/api/auth/google`;
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-emerald-100 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center shadow-xl">
              <Leaf className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-center text-emerald-600 mb-8 text-lg">
            Sign in to continue to Dragonfly
          </p>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-700 text-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-all rounded-xl font-semibold mb-4"
          >
            <Chrome className="w-5 h-5 mr-2" />
            Continue with Google
          </Button>

          {/* Biometric Login Button */}
          {isSupported && (
            <Button
              onClick={handleBiometricLogin}
              disabled={isBiometricLoading}
              className="w-full h-14 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white text-lg mb-6 shadow-lg hover:shadow-xl transition-all rounded-xl font-semibold"
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

          {isSupported && (
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-emerald-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 text-emerald-600 font-medium">Or sign in with email</span>
              </div>
            </div>
          )}

          {/* Traditional Login Form */}
          <form onSubmit={handleTraditionalLogin} className="space-y-5">
            <div>
              <Label className="text-emerald-800 font-semibold">Email</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-12 h-14 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl text-lg"
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-emerald-800 font-semibold">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 h-14 border-2 border-emerald-200 focus:border-emerald-400 rounded-xl text-lg"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-emerald-700">
              Don't have an account?{' '}
              <button 
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Home'))}
                className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* Info */}
          {isSupported && (
            <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200">
              <p className="text-sm text-emerald-700 text-center leading-relaxed">
                💡 Face ID is <span className="font-semibold">optional</span> and can be set up after signing in
              </p>
            </div>
          )}
        </div>

        {/* Trust Badge */}
        <div className="mt-6 text-center">
          <p className="text-sm text-emerald-600">
            🔒 Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}