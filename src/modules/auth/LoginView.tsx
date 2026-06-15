/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ChefHat, Users } from 'lucide-react';
import { UserSession } from '../../types';
import { STAFF_USERS } from '../../data';
import birdIllustration from '../../assets/images/high_quality_detailed_illustration_of_a_crested_bird_perched_on_a_branch_surrounded_by_monstera_and_1yc17v04a2iybeq57gl3_1.png';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailPulse, setEmailPulse] = useState(false);
  const [passwordPulse, setPasswordPulse] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const match = STAFF_USERS.find(
        u => u.email === username.toLowerCase().trim() && u.password === password.toLowerCase().trim()
      );

      if (match) {
        onLoginSuccess({
          email: match.email,
          name: match.name,
          role: match.role as any
        });
      } else {
        setErrorMsg('Usuario y/o contraseña incorrectos.');
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (username.length === 0 && val.length > 0) {
      setEmailPulse(true);
      setTimeout(() => setEmailPulse(false), 700);
    }
    setUsername(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (password.length === 0 && val.length > 0) {
      setPasswordPulse(true);
      setTimeout(() => setPasswordPulse(false), 700);
    }
    setPassword(val);
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'administrador': return ChefHat;
      case 'mesero': return Users;
      default: return ChefHat;
    }
  };

  return (
    <div className="min-h-screen bg-pandora-dark flex items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-pandora-accent selection:text-white font-sans overflow-y-auto">

      {/* Container split layout - más grande */}
      <motion.div
        id="login_container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1100px] bg-surface-card/95 backdrop-blur-md rounded-2xl border border-border-default overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
      >

        {/* Left Side: Editorial Café Visual - más grande */}
        <div
          id="login_visual_panel"
          className="w-full md:w-1/2 relative flex flex-col justify-between p-8 text-white min-h-[300px] md:min-h-auto border-b md:border-b-0 md:border-r border-pandora-border overflow-hidden"
          style={{
            backgroundColor: '#14213D'
          }}
        >
          <div className="absolute inset-0 z-0 overflow-hidden bg-pandora-dark flex items-center justify-center p-2">
            <img
              src="https://i.imgur.com/ARe5rPr.jpeg"
              alt="Logo Café Pandora"
              className="w-60 h-60 sm:w-80 sm:h-80 md:w-[28rem] md:h-[28rem] object-cover rounded-full shadow-2xl border-2 border-pandora-gold/40 animate-pulse-slow"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(20, 33, 61, 0.3) 0%, rgba(20, 33, 61, 0.1) 60%, rgba(20, 33, 61, 0.7) 100%)'
              }}
            ></div>
          </div>

          <div id="visual_top" className="relative z-10 flex items-center gap-2">
          </div>

          <div id="visual_bottom" className="relative z-10 pt-12 md:pt-0 mt-auto">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Café Pandora
            </h1>
            <p className="mt-1 text-sm text-pandora-gold font-serif font-medium uppercase tracking-wider">
              Bistro Cafe Bar
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel with username/password */}
        <div id="login_form_panel" className="w-full md:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-pandora-bg">

          <div id="form_header" className="mb-6 text-center md:text-left">
            <h2 className="font-sans text-2xl font-bold text-text-primary">Acceso Administrativo</h2>
            <p className="text-xs text-text-muted mt-1 font-light">
              Ingrese su correo electrónico y contraseña
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-pandora-error-bg border border-pandora-danger/30 rounded-lg text-pandora-danger text-xs text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`block text-xs font-medium mb-1.5 transition-colors duration-300 ${username.length > 0 ? 'text-pandora-gold' : 'text-text-muted'}`}>
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail className={`w-4 h-4 transition-colors duration-300 ${username.length > 0 ? 'text-pandora-gold' : 'text-text-muted'}`} />
                </div>
                <input
                  id="username_input"
                  type="text"
                  value={username}
                  onChange={handleEmailChange}
                  className={`w-full text-text-primary bg-surface-input rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none border transition-all duration-300 placeholder:text-text-muted/50 ${
                    username.length > 0
                      ? 'border-pandora-gold/40 ring-1 ring-pandora-gold/15'
                      : 'border-border-default'
                  } ${emailPulse ? 'animate-[glow-pulse_0.7s_ease-in-out]' : ''}`}
                  placeholder="correo@ejemplo.com"
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
              <p className={`text-[10px] mt-1.5 ml-1 transition-all duration-500 ${username.length > 0 ? 'opacity-70 text-text-muted' : 'opacity-30 text-text-muted'}`}>
                Ej: admin@pandora.com
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className={`block text-xs font-medium transition-colors duration-300 ${password.length > 0 ? 'text-pandora-gold' : 'text-text-muted'}`}>
                  Contraseña
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className={`w-4 h-4 transition-colors duration-300 ${password.length > 0 ? 'text-pandora-gold' : 'text-text-muted'}`} />
                </div>
                <input
                  id="password_input"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full text-text-primary bg-surface-input rounded-lg pl-9 pr-4 py-2.5 text-sm outline-none border transition-all duration-300 placeholder:text-text-muted/50 font-mono tracking-widest ${
                    password.length > 0
                      ? 'border-pandora-gold/40 ring-1 ring-pandora-gold/15'
                      : 'border-border-default'
                  } ${passwordPulse ? 'animate-[glow-pulse_0.7s_ease-in-out]' : ''}`}
                  placeholder="contraseña"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
              <p className={`text-[10px] mt-1.5 ml-1 transition-all duration-500 ${password.length > 0 ? 'opacity-70 text-text-muted' : 'opacity-30 text-text-muted'}`}>
                Ej: admin123
              </p>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-pandora-success hover:bg-pandora-success-hover text-white rounded-lg py-3 text-sm font-semibold shadow-md transition-all hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Iniciando Sesión...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Credentials Panel */}
          <div id="credentials_panel" className="mt-8 pt-6 border-t border-border-default">
            <span className="block text-xs font-semibold text-pandora-gold uppercase tracking-wider mb-3">
              Credenciales del Sistema
            </span>
            <div className="space-y-2">
              {STAFF_USERS.filter(u => u).map((u) => {
                const Icon = getRoleIcon(u.role);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border-default bg-surface-card/40 text-xs text-text-muted"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-pandora-gold" />
                    <div className="truncate flex-1">
                      <p className="font-semibold truncate text-text-primary leading-tight">{u.name}</p>
                      <p className="text-[10px] truncate lowercase">
                        {u.role} &middot; {u.email.toLowerCase()} / {u.password.toLowerCase()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
