import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.png';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(email, password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center" style={{ backgroundColor: '#0A0A0A' }}>
        <img
          src={logo}
          alt="Sea of Glass Logo"
          className="w-20 h-20 mb-6"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <h1 className="font-heading text-2xl font-semibold text-white">
          Sea of Glass Rustenburg
        </h1>
        <p className="font-body text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          New Heaven and New Earth
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-card px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src={logo} alt="Sea of Glass Logo" className="w-16 h-16 mb-4" />
            <h1 className="font-heading text-xl font-semibold text-foreground">Sea of Glass Rustenburg</h1>
            <p className="font-body text-xs text-muted-foreground mt-1">New Heaven and New Earth</p>
          </div>

          <h2 className="font-heading text-2xl font-bold text-foreground mb-1">Sign in</h2>
          <p className="font-body text-sm text-muted-foreground mb-8">Enter your credentials to access the dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="font-heading text-sm font-medium text-foreground block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-destructive text-sm font-body">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-heading font-semibold text-sm hover:bg-sidebar-accent-hover transition-colors"
            >
              Sign in
            </button>
          </form>

          <p className="text-xs text-muted-foreground font-body mt-8 text-center">
            Demo: thabo@example.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
