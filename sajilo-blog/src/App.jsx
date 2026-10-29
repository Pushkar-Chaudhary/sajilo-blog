import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import {
  createArticleApi,
  deleteArticleApi,
  getArticleApi,
  updateArticleApi,
  getArticlesApi,
  getBookmarksApi,
  getCurrentUserApi,
  logoutApi,
  toggleBookmarkApi,
} from './services/api'

const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const Profile = lazy(() => import('./pages/Profile'))
const WriteBlog = lazy(() => import('./pages/WriteBlog'))

const fallbackCoverImages = [
  'photo-1555949963-ff9fe0c870eb',
  'photo-1677442136019-21780ecad995',
  'photo-1517842645767-c639042777db',
  'photo-1498050108023-c5249f4df085',
  'photo-1460925895917-afdab827c52f',
  'photo-1490750967868-88aa4486c946',
  'photo-1488646953014-85cb44e25828',
  'photo-1512820790803-83ca734da794',
  'photo-1497366754035-f200968a6e72',
  'photo-1500534623283-312aade485b7',
]

const getFallbackCover = (article) => {
  const key = article._id || article.slug || article.title || ''
  const index = [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0) % fallbackCoverImages.length
  return `https://images.unsplash.com/${fallbackCoverImages[index]}?auto=format&fit=crop&w=1200&q=80`
}

const toBlogCard = (article) => ({
  _id: article._id,
  slug: article.slug,
  title: article.title,
  subTitle: article.subtitle || '',
  category: article.category?.name || article.category || 'Technology',
  image: article.coverImage || getFallbackCover(article),
  description: article.content || '',
  createdAt: article.publishedAt || article.createdAt,
  updatedAt: article.updatedAt,
  author: article.author?.name || 'Community Member',
  authorId: article.author?._id,
  tags: article.tags || [],
  isPublished: article.status === 'published',
  isBookmarked: article.isBookmarked || false,
})

const AuthRequired = ({ onOpenAuth }) => (
  <div className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="text-2xl font-bold text-gray-900">Sign in to continue</h1>
    <p className="mt-2 text-sm text-gray-600">Create an account or sign in to access your profile and publish articles.</p>
    <button
      type="button"
      onClick={() => onOpenAuth('login')}
      className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
    >
      Sign in or create an account
    </button>
  </div>
)

const App = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [articlesError, setArticlesError] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    let active = true

    getCurrentUserApi()
      .then(({ user: currentUser }) => {
        if (active) setUser(currentUser)
      })
      .catch((error) => {
        if (![401, 503].includes(error.response?.status) && active) {
          toast.error('Could not verify your session with the server.')
        }
      })

    getArticlesApi()
      .then(({ articles }) => {
        if (active) {
          setBlogs(articles.map(toBlogCard))
          setArticlesError('')
        }
      })
      .catch((error) => {
        if (active) {
          setArticlesError(error.response?.data?.message || 'Stories are temporarily unavailable. Check the API connection and retry.')
        }
      })
      .finally(() => {
        if (active) setLoadingArticles(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    if (!user) {
      return () => {
        active = false
      }
    }

    getBookmarksApi()
      .then(({ bookmarks: savedArticles }) => {
        if (active) {
          setBookmarks(savedArticles.map(({ article }) => toBlogCard({
            ...article,
            isBookmarked: true,
          })))
        }
      })
      .catch(() => {
        if (active) toast.error('Could not load your saved stories.')
      })
    return () => {
      active = false
    }
  }, [user])

  const handleOpenAuth = (mode = 'login') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser)
  }

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch {
      toast.error('Could not confirm sign out with the server.')
    } finally {
      setUser(null)
      setBookmarks([])
      navigate('/')
    }
  }

  const handleAddBlog = async (article) => {
    const response = await createArticleApi(article)
    const blog = toBlogCard(response.article)
    setBlogs((currentBlogs) => [blog, ...currentBlogs])
    return blog
  }

  const handleUpdateBlog = async (id, article) => {
    const response = await updateArticleApi(id, article)
    const blog = toBlogCard(response.article)
    setBlogs((currentBlogs) => {
      const withoutUpdated = currentBlogs.filter((item) => item._id !== blog._id)
      return blog.isPublished ? [blog, ...withoutUpdated] : withoutUpdated
    })
    return blog
  }

  const handleLoadBlog = useCallback(async (slug) => {
    const response = await getArticleApi(slug)
    return toBlogCard(response.article)
  }, [])

  const handleToggleBookmark = async (blog) => {
    const { bookmarked } = await toggleBookmarkApi(blog._id)
    setBlogs((current) => current.map((item) => (
      item._id === blog._id ? { ...item, isBookmarked: bookmarked } : item
    )))
    setBookmarks((current) => bookmarked
      ? [...current.filter((item) => item._id !== blog._id), { ...blog, isBookmarked: true }]
      : current.filter((item) => item._id !== blog._id))
    toast.success(bookmarked ? 'Story saved.' : 'Story removed from saved stories.')
  }

  const handleDeleteBlog = async (blog) => {
    await deleteArticleApi(blog._id)
    setBlogs((currentBlogs) => currentBlogs.filter((item) => item._id !== blog._id))
    toast.success('Article deleted.')
    navigate('/')
  }

  const handleAdminDeleteArticle = async (id) => {
    await deleteArticleApi(id)
    setBlogs((currentBlogs) => currentBlogs.filter((item) => item._id !== id))
    toast.success('Article deleted.')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />

      <Navbar
        onOpenAuth={handleOpenAuth}
        user={user}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-gray-500">Loading page...</div>}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  blogs={blogs}
                  loading={loadingArticles}
                  error={articlesError}
                  onRetry={() => {
                    setLoadingArticles(true)
                    setArticlesError('')
                    getArticlesApi()
                      .then(({ articles }) => setBlogs(articles.map(toBlogCard)))
                      .catch((error) => setArticlesError(
                        error.response?.data?.message || 'Stories are temporarily unavailable. Check the API connection and retry.'
                      ))
                      .finally(() => setLoadingArticles(false))
                  }}
                  user={user}
                  onToggleBookmark={handleToggleBookmark}
                  onRequestAuth={handleOpenAuth}
                />
              }
            />
            <Route
              path="/blog"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/blog/:id"
              element={
                <Blog
                  blogs={blogs}
                  user={user}
                  onDeleteBlog={handleDeleteBlog}
                  onLoadBlog={handleLoadBlog}
                  onRequestAuth={handleOpenAuth}
                  onToggleBookmark={handleToggleBookmark}
                />
              }
            />
            <Route
              path="/profile"
              element={user ? (
                <Profile
                  user={user}
                  bookmarks={bookmarks}
                  onToggleBookmark={handleToggleBookmark}
                  onUpdateUser={handleUpdateUser}
                  onLogout={handleLogout}
                  onAdminDeleteArticle={handleAdminDeleteArticle}
                />
              ) : (
                <AuthRequired onOpenAuth={handleOpenAuth} />
              )}
            />
            <Route
              path="/write/:id?"
              element={
                <WriteBlog
                  onAddBlog={handleAddBlog}
                  onUpdateBlog={handleUpdateBlog}
                  user={user}
                  onRequestAuth={handleOpenAuth}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Suspense>
      </main>

      <Footer />

      <AuthModal
        key={authMode}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleUpdateUser}
      />

    </div>
  )
}

export default App
