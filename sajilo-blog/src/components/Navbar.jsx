import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const Navbar = ({ onOpenAuth, user, onLogout, onOpenAiStudio }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <img
              src="/favicon.svg"
              alt="Sajilo Blog Logo"
              className="h-9 w-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-extrabold tracking-tight text-zinc-900">
              Sajilo <span className="font-semibold text-zinc-500">Blog</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/'
                  ? 'text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Feed
            </Link>
            <Link
              to="/blog"
              className={`text-sm font-semibold transition-colors ${
                location.pathname === '/blog'
                  ? 'text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Explore
            </Link>
            
            {/* Clean Solid AI Studio button */}
            <button
              type="button"
              onClick={onOpenAiStudio}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              AI Studio
            </button>
          </nav>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Write Button */}
          <Link
            to="/write"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 hover:border-zinc-900 transition-colors cursor-pointer"
          >
            <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Write Story
          </Link>

          {/* User Account State */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-2xl p-1 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center text-white font-bold text-sm">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-bold text-zinc-900 leading-none">{user.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Author</p>
                </div>
                <svg className="h-3.5 w-3.5 text-zinc-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-zinc-200 z-50">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-xs font-bold text-zinc-900">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email || 'Author Account'}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Modify Account &amp; Profile
                  </Link>

                  <Link
                    to="/write"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                  >
                    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Article
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onOpenAiStudio()
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors text-left cursor-pointer"
                  >
                    <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Picture &amp; Story Studio
                  </button>

                  <div className="border-t border-zinc-100 my-1"></div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden rounded-xl p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white p-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-zinc-800"
          >
            Feed
          </Link>
          <Link
            to="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-zinc-800"
          >
            Explore
          </Link>
          <Link
            to="/write"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-zinc-900"
          >
            Write Story
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              onOpenAiStudio()
            }}
            className="block text-sm font-semibold text-zinc-800 text-left"
          >
            AI Creative Studio
          </button>
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-zinc-900"
            >
              Account Profile Settings
            </Link>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
