import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Lock } from 'lucide-react';

const CORRECT_PASSWORD = "Dragonbreath777"; // Change this to your desired password

export default function PasswordGuard({ children }) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if already authenticated in session
    const auth = sessionStorage.getItem('factory_wholesale_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('factory_wholesale_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-emerald-200 max-w-md w-full mx-4">
        <div className="bg-gradient-to-br from-emerald-100 to-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-emerald-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-emerald-900 mb-2 text-center">Factory Wholesale</h2>
        <p className="text-emerald-600 mb-6 text-center">
          Enter password to access vendor orders
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="h-12 text-center text-lg"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-green-500 h-12 text-lg"
          >
            <Lock className="w-5 h-5 mr-2" />
            Access System
          </Button>
        </form>
      </div>
    </div>
  );
}