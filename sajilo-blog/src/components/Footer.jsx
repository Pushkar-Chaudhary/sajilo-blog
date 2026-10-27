import React from 'react'
import { Link } from 'react-router-dom'
import { assets, footer_data } from '../assets/assets'

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/favicon.svg"
                alt="Sajilo Blog"
                className="h-8 w-8 object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Sajilo <span className="text-indigo-600">Blog</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Your trusted companion for modern thoughts, practical advice, and in-depth tech and lifestyle guides.
            </p>
            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#facebook"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <img src={assets.facebook_icon} alt="Facebook" className="h-4 w-4" />
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <img src={assets.twitter_icon} alt="Twitter" className="h-4 w-4" />
              </a>
              <a
                href="#google"
                aria-label="Google"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <img src={assets.googleplus_icon} alt="Google" className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Dynamic footer columns */}
          {footer_data.map((col, index) => (
            <div key={index} className="md:col-span-1">
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to="/"
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} Sajilo Blog. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#terms" className="hover:text-gray-600">Terms of Service</a>
            <a href="#cookies" className="hover:text-gray-600">Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
