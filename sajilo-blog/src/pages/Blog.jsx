import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import BlogCard from '../components/BlogCard'
import toast from 'react-hot-toast'
import { createCommentApi, getCommentsApi } from '../services/api'

const categoryColors = {
  Technology: 'bg-blue-100 text-blue-800 border-blue-200',
  Startup: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Lifestyle: 'bg-amber-100 text-amber-800 border-amber-200',
  Finance: 'bg-purple-100 text-purple-800 border-purple-200',
}

const Blog = ({
  blogs,
  user,
  onDeleteBlog,
  onLoadBlog,
  onRequestAuth,
  onToggleBookmark,
}) => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loadedBlog, setLoadedBlog] = useState(null)
  const [articleError, setArticleError] = useState('')
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentsError, setCommentsError] = useState('')
  const [commentText, setCommentText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const blog = loadedBlog || blogs.find((item) => item._id === id || item.slug === id)
  const canDelete = blog && user && (
    user.role === 'admin' ||
    (blog.authorId && blog.authorId === user._id)
  )

  useEffect(() => {
    let active = true
    onLoadBlog(id)
      .then((article) => {
        if (active) setLoadedBlog(article)
      })
      .catch(() => {
        if (active) setArticleError('This story could not be found or loaded.')
      })
    return () => {
      active = false
    }
  }, [id, onLoadBlog])

  useEffect(() => {
    if (!blog) return
    let active = true
    getCommentsApi(blog._id)
      .then(({ comments: loadedComments }) => {
        if (active) setComments(loadedComments)
      })
      .catch(() => {
        if (active) setCommentsError('Comments could not be loaded.')
      })
      .finally(() => {
        if (active) setCommentsLoading(false)
      })
    return () => {
      active = false
    }
  }, [blog])

  const handleDelete = async () => {
    if (!window.confirm('Delete this article permanently?')) return
    setDeleting(true)
    try {
      await onDeleteBlog(blog)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the article.')
      setDeleting(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!user) {
      onRequestAuth('login')
      return
    }
    if (!commentText.trim()) {
      toast.error('Please enter a comment.')
      return
    }

    try {
      const { comment } = await createCommentApi(blog._id, commentText.trim())
      setComments((current) => [comment, ...current])
      setCommentText('')
      toast.success('Comment posted successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not post your comment.')
    }
  }

  if (!blog) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {articleError ? 'Story unavailable' : 'Loading story…'}
        </h1>
        {articleError && <p className="mt-2 text-sm text-gray-600">{articleError}</p>}
        <Link to="/" className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Back to stories
        </Link>
      </div>
    )
  }

  const relatedBlogs = blogs
    .filter((item) => item._id !== blog._id && item.category === blog.category)
    .slice(0, 3)
  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const categoryStyle = categoryColors[blog.category] || 'bg-slate-100 text-slate-800'

  return (
    <article className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back navigation & breadcrumbs */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          <nav className="flex items-center gap-2 text-xs text-gray-500">
            <Link to="/" className="hover:text-gray-900">Home</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{blog.category}</span>
          </nav>
        </div>

        {/* Article Header */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-200/80 mb-10">
          {canDelete && (
            <div className="mb-5 flex justify-end gap-2">
              <Link
                to={`/write/${blog.slug || blog._id}`}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Edit article
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete article'}
              </button>
            </div>
          )}
          <div className="mb-4">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${categoryStyle}`}>
              {blog.category}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
            {blog.title}
          </h1>

          {blog.subTitle && (
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {blog.subTitle.replace(/<[^>]+>/g, '')}
            </p>
          )}

          {/* Author & metadata */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {(blog.author || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{blog.author || 'Sajilo Editorial Team'}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span>5 min read</span>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-400">Share:</span>
              <button 
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  toast.success('Link copied to clipboard!')
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                title="Copy Link"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mt-8 overflow-hidden rounded-2xl bg-gray-100 shadow-md">
            <img
              src={blog.image}
              alt={blog.title}
              className="w-full max-h-[480px] object-cover"
            />
          </div>

          {/* Article HTML Content */}
          <div
            className="rich-text mt-10 pt-6 border-t border-gray-100"
            dangerouslySetInnerHTML={{ __html: blog.description }}
          />
        </div>

        {/* Comments Section */}
        <section className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-200/80 mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 flex items-center gap-2">
            <span>Comments</span>
            <span className="text-sm font-medium rounded-full bg-gray-100 px-2.5 py-0.5 text-gray-600">
              {comments.length}
            </span>
          </h2>

          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleAddComment} className="mb-8 space-y-4 rounded-2xl bg-slate-50 p-5 border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900">Leave a reply as {user.name}</h3>
              <textarea
                rows="3"
                required
                maxLength={2000}
                placeholder="What are your thoughts on this story?"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-sm"
                >
                  Post Comment
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 rounded-2xl bg-slate-50 p-5 text-sm text-gray-700">
              <button type="button" onClick={() => onRequestAuth('login')} className="font-semibold text-indigo-600 hover:text-indigo-800">
                Sign in
              </button>{' '}
              to join the conversation.
            </div>
          )}

          {/* Comment list */}
          <div className="space-y-4">
            {commentsLoading && <p className="py-6 text-center text-sm text-gray-500">Loading comments…</p>}
            {commentsError && <p className="py-6 text-center text-sm text-red-600" role="alert">{commentsError}</p>}
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment._id} className="rounded-2xl border border-gray-100 p-4 sm:p-5 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-gray-900">{comment.author?.name || 'Community writer'}</span>
                    <span className="text-xs text-gray-400">
                      {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                </div>
              ))
            ) : !commentsLoading && !commentsError ? (
              <p className="text-center text-sm text-gray-500 py-6">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : null}
          </div>
        </section>

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
              More from {blog.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedBlogs.map((b) => (
                <BlogCard
                  key={b._id}
                  blog={b}
                  user={user}
                  onToggleBookmark={onToggleBookmark}
                  onRequestAuth={onRequestAuth}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

export default Blog
