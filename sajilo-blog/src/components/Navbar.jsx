import React from 'react'

const Navbar = () => {
  return (
    
<header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

    {/* Logo and Brand */}
    <a href="/" className="flex items-center gap-3">
      <img
        src="/favicon.svg"
        alt="Sajilo Blog Logo"
        className="h-9 w-9 rounded-lg object-contain"
      />
      <span className="text-xl font-bold tracking-tight text-gray-900">
        Sajilo <span className="text-gray-500">Blog</span>
      </span>
    </a>

    {/* Navigation */}
    <nav className="hidden items-center gap-8 sm:flex">
      <a
        href="/"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-950"
      >
        Home
      </a>
      <a
        href="/blog"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-950"
      >
        Blog
      </a>
    </nav>

    {/* Authentication */}
    <div className="flex items-center gap-3">
      <a
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
      >
        Login
      </a>
      <a
        href="/signup"
        className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        Get Started
      </a>
    </div>

  </div>
</header>

  )
}

export default Navbar
