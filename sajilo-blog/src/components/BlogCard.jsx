import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const categoryBadges = {
  Technology: 'bg-blue-50 text-blue-700 border-blue-200/80',
  Startup: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  Lifestyle: 'bg-amber-50 text-amber-700 border-amber-200/80',
  Finance: 'bg-purple-50 text-purple-700 border-purple-200/80',
}

const BlogCard = ({ blog }) => {
  const [isBookmarked, setIsBookmarked] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('sajilo_bookmarks') || '[]')
      return saved.includes(blog._id)
    } catch {
      return false
    }
  })

  const toggleBookmark = (e) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const saved = JSON.parse(localStorage.getItem('sajilo_bookmarks') || '[]')
      let updated
      if (saved.includes(blog._id)) {
        updated = saved.filter((id) => id !== blog._id)
        setIsBookmarked(false)
        toast.success('Removed from bookmarks')
      } else {
        updated = [...saved, blog._id]
        setIsBookmarked(true)
        toast.success('Saved to bookmarks!')
      }
      localStorage.setItem('sajilo_bookmarks', JSON.stringify(updated))
    } catch (err) {}
  }

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const plainText = blog.description
    ? blog.description.replace(/<[^>]+>/g, '').slice(0, 130) + '...'
    : ''

  const badgeStyle = categoryBadges[blog.category] || 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-gray-200/80 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-100">
      
      {/* Blog Image */}
      <Link to={`/blog/${blog._id}`} className="relative aspect-[16/10] overflow-hidden bg-slate-100 block">
        <img
          src={blog.image}
          alt={blog.title}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-bold backdrop-blur-md shadow-xs ${badgeStyle}`}>
            {blog.category}
          </span>
        </div>

        {/* Bookmark quick button */}
        <button
          type="button"
          onClick={toggleBookmark}
          className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 text-gray-700 backdrop-blur-md shadow-sm hover:bg-white hover:text-indigo-600 transition-colors cursor-pointer"
          title={isBookmarked ? 'Bookmarked' : 'Save article'}
        >
          <svg className={`h-4 w-4 ${isBookmarked ? 'fill-indigo-600 text-indigo-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2.5">
            <span>{formattedDate}</span>
            <span>&bull;</span>
            <span>4 min read</span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
            <Link to={`/blog/${blog._id}`}>
              {blog.title}
            </Link>
          </h2>

          {/* Subtitle / Excerpt */}
          <p className="mt-2.5 text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {blog.subTitle ? blog.subTitle.replace(/<[^>]+>/g, '') : plainText}
          </p>
        </div>

        {/* Card Footer: Author + Arrow link */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[11px] font-bold">
              {(blog.author || 'S').charAt(0)}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {blog.author || 'Sajilo Team'}
            </span>
          </div>

          <Link
            to={`/blog/${blog._id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:text-indigo-700 transition-colors"
          >
            Read
            <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

    </article>
  )
}

export default BlogCard
