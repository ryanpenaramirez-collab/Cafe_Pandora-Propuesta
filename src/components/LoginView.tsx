/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, ChefHat, Users } from 'lucide-react';
import { UserSession } from '../types';
import { STAFF_USERS } from '../data';
// @ts-ignore
import birdIllustration from '../assets/images/high_quality_detailed_illustration_of_a_crested_bird_perched_on_a_branch_surrounded_by_monstera_and_1yc17v04a2iybeq57gl3_1.png';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [role, setRole] = useState('mesero');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setIsSubmitting(true);

    // Validate by u.name + u.pin
    setTimeout(() => {
      const match = STAFF_USERS.find(
        u => u.name === username && u.pin === password
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

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'administrador': return ChefHat;
      case 'mesero': return Users;
      default: return ChefHat;
    }
  };

  return (
    <div className="min-h-screen bg-[#3A7AB5] flex items-center justify-center p-4 sm:p-6 md:p-8 selection:bg-pandora-accent selection:text-white font-sans overflow-y-auto">

      {/* Container split layout - más grande */}
      <motion.div
        id="login_container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[1100px] bg-[#FFFFFF] backdrop-blur-md rounded-2xl border border-[#D0E8F8] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px]"
      >

        {/* Left Side: Editorial Café Visual - más grande */}
        <div
          id="login_visual_panel"
          className="w-full md:w-1/2 relative flex flex-col justify-between p-8 text-white min-h-[300px] md:min-h-auto border-b md:border-b-0 md:border-r border-[#D0E8F8] overflow-hidden"
          style={{
            backgroundColor: '#3A7AB5'
          }}
        >
          <div className="absolute inset-0 z-0 overflow-hidden bg-[#2C6AA0] flex items-center justify-center p-2">
            <img
              src="https://i.imgur.com/ARe5rPr.jpeg"
              alt="Logo Café Pandora"
              className="w-60 h-60 sm:w-80 sm:h-80 md:w-[28rem] md:h-[28rem] object-cover rounded-full shadow-2xl border-2 border-[#C8A96E]/40 animate-pulse-slow"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(58, 122, 181, 0.3) 0%, rgba(58, 122, 181, 0.1) 60%, rgba(58, 122, 181, 0.7) 100%)'
              }}
            ></div>
          </div>

          <div id="visual_top" className="relative z-10 flex items-center gap-2">
          </div>

          <div id="visual_bottom" className="relative z-10 pt-12 md:pt-0 mt-auto">
            <h1 className="font-serif text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FFFFFF] leading-tight">
              Café Pandora
            </h1>
            <p className="mt-1 text-sm text-[#C8A96E] font-serif font-medium uppercase tracking-wider">
              Bistro Cafe Bar
            </p>
          </div>
        </div>

        {/* Right Side: Form Panel with username/password */}
        <div id="login_form_panel" className="w-full md:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-12 bg-[#3A7AB5]">

          <div id="form_header" className="mb-6 text-center md:text-left">
            <h2 className="font-sans text-2xl font-bold text-[#FFFFFF]">Acceso Administrativo</h2>
            <p className="text-xs text-[#8AAAC8] mt-1 font-light">
              Ingrese su nombre de usuario y contraseña
            </p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-[#FFF0F0] border border-[#F8C8C8] rounded-lg text-[#C45A5A] text-xs text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5A7A9A] mb-1">Nombre de Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8AAAC8]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="username_input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-[#2C3E55] bg-[#F5F9FF] border border-[#D0E8F8] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-pandora-accent focus:ring-1 focus:ring-pandora-accent transition-all placeholder:text-[#C0D5E8]"
                  placeholder="Ingrese su nombre"
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-[#5A7A9A]">Contraseña</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8AAAC8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password_input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-[#2C3E55] bg-[#F5F9FF] border border-[#D0E8F8] rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-pandora-accent focus:ring-1 focus:ring-pandora-accent transition-all placeholder:text-[#C0D5E8] font-mono tracking-widest"
                  placeholder="Contraseña"
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#5B9BD5] hover:bg-[#3A7AB5] text-[#FFFFFF] rounded-lg py-3 text-sm font-semibold shadow-md transition-all hover:-translate-y-[1px] active:translate-y-0 flex items-center justify-center gap-2"
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
          <div id="credentials_panel" className="mt-8 pt-6 border-t border-[#D0E8F8]">
            <span className="block text-xs font-semibold text-[#C8A96E] uppercase tracking-wider mb-3">
              Credenciales del Sistema
            </span>
            <div className="space-y-2">
              {STAFF_USERS.filter(u => u).map((u) => {
                const Icon = getRoleIcon(u.role);
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg border border-[#D0E8F8] text-xs text-[#5A7A9A]"
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#C8A96E]" />
                    <div className="truncate flex-1">
                      <p className="font-semibold truncate text-[#2C3E55] leading-tight">{u.name}</p>
                      <p className="text-[10px] capitalize truncate">{u.role} · PIN: {u.pin}</p>
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
