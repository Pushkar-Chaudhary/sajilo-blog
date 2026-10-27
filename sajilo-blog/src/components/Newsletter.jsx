import React, { useState } from 'react'
import toast from 'react-hot-toast'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setEmail('')
      toast.success('Thank you for subscribing to Sajilo Blog!')
    }, 500)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-zinc-900 px-6 py-12 sm:px-12 sm:py-16 lg:px-16 text-center text-white border border-zinc-800">
        <div className="mx-auto max-w-2xl">
          <span className="inline-block rounded-full bg-zinc-800 border border-zinc-700 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Newsletter
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Never miss an insightful article
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Join 10,000+ readers getting weekly updates on technology, startup insights, and modern lifestyle guides. No spam, ever.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="w-full sm:w-80 rounded-xl bg-zinc-800/80 px-4 py-3 text-sm text-white placeholder-zinc-500 border border-zinc-700 focus:border-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
