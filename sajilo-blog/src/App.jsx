import React, { useState, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import AiStudio from './components/AiStudio'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Profile from './pages/Profile'
import WriteBlog from './pages/WriteBlog'
import { blog_data } from './assets/assets'

const DEFAULT_USER = {
  name: 'Alex Morgan',
  email: 'alex.morgan@sajiloblog.com',
  bio: 'Passionate writer, tech enthusiast, and builder exploring the intersection of AI, modern software architecture, and design craftsmanship.',
  website: 'https://alexmorgan.dev',
  avatar: '',
  role: 'Author',
}

const App = () => {
  // User state with localStorage persistence
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sajilo_user')
      return saved ? JSON.parse(saved) : DEFAULT_USER
    } catch {
      return DEFAULT_USER
    }
  })

  // Blogs list with persistence for user-created blogs
  const [blogs, setBlogs] = useState(() => {
    try {
      const custom = JSON.parse(localStorage.getItem('sajilo_custom_blogs') || '[]')
      return [...custom, ...blog_data]
    } catch {
      return blog_data
    }
  })

  // Auth Modal State
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  // AI Studio Modal State
  const [aiStudioOpen, setAiStudioOpen] = useState(false)

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleUpdateUser = (updatedData) => {
    setUser(updatedData)
    localStorage.setItem('sajilo_user', JSON.stringify(updatedData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('sajilo_user')
    localStorage.removeItem('sajilo_token')
  }

  const handleAddBlog = (newBlog) => {
    const custom = JSON.parse(localStorage.getItem('sajilo_custom_blogs') || '[]')
    const updatedCustom = [newBlog, ...custom]
    localStorage.setItem('sajilo_custom_blogs', JSON.stringify(updatedCustom))
    setBlogs([newBlog, ...blogs])
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      {/* Global Navigation Header */}
      <Navbar
        onOpenAuth={handleOpenAuth}
        user={user}
        onLogout={handleLogout}
        onOpenAiStudio={() => setAiStudioOpen(true)}
      />

      {/* App Routes */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={<Home blogs={blogs} onOpenAiStudio={() => setAiStudioOpen(true)} />}
          />
          <Route
            path="/blog"
            element={<Home blogs={blogs} onOpenAiStudio={() => setAiStudioOpen(true)} />}
          />
          <Route
            path="/blog/:id"
            element={<Blog blogs={blogs} user={user} />}
          />
          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                onUpdateUser={handleUpdateUser}
                onLogout={handleLogout}
              />
            }
          />
          <Route
            path="/write"
            element={<WriteBlog onAddBlog={handleAddBlog} user={user} />}
          />
          <Route
            path="*"
            element={<Home blogs={blogs} onOpenAiStudio={() => setAiStudioOpen(true)} />}
          />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(userData) => handleUpdateUser(userData)}
      />

      {/* AI Studio Modal (Vision & Text) */}
      <AiStudio
        isOpen={aiStudioOpen}
        onClose={() => setAiStudioOpen(false)}
      />
    </div>
  )
}

export default App
