import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { generateAiArticleApi, getArticleApi, rewriteAiTextApi, uploadImage } from '../services/api'
import { blogCategories } from '../assets/assets'

const WriteBlog = ({ onAddBlog, onUpdateBlog, user, onRequestAuth }) => {
  const navigate = useNavigate()
  const { id } = useParams()
  const coverInputRef = useRef(null)
  const contentInputRef = useRef(null)
  const [articleId, setArticleId] = useState('')
  const [loadingArticle, setLoadingArticle] = useState(Boolean(id))

  const [title, setTitle] = useState('')
  const [subTitle, setSubTitle] = useState('')
  const [category, setCategory] = useState('Technology')
  const [coverImage, setCoverImage] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  const [uploadingCover, setUploadingCover] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiAudience, setAiAudience] = useState('')
  const [aiTone, setAiTone] = useState('Warm and conversational')
  const [aiLength, setAiLength] = useState('Standard (600-800 words)')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [rewritingAI, setRewritingAI] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    getArticleApi(id)
      .then(({ article }) => {
        if (!active) return
        setArticleId(article._id)
        setTitle(article.title || '')
        setSubTitle(article.subtitle || '')
        setCategory(article.category?.name || 'Technology')
        setCoverImage(article.coverImage || '')
        setContent(article.content || '')
        setTags((article.tags || []).join(', '))
      })
      .catch((error) => {
        if (active) {
          toast.error(error.response?.data?.message || 'Could not load this article for editing.')
          navigate('/profile')
        }
      })
      .finally(() => {
        if (active) setLoadingArticle(false)
      })
    return () => {
      active = false
    }
  }, [id, navigate])

  const handleGenerateDraft = async () => {
    if (!user) {
      onRequestAuth('login')
      return
    }
    if (!aiTopic.trim()) {
      toast.error('Enter a topic for your draft.')
      return
    }
    if ((title.trim() || content.trim()) && !window.confirm('Replace the current title and article text with a new AI draft?')) {
      return
    }

    setGeneratingAI(true)
    try {
      const { result } = await generateAiArticleApi({
        topic: aiTopic.trim(),
        audience: aiAudience.trim(),
        tone: aiTone,
        length: aiLength,
        category,
      })
      setTitle(result.title)
      setSubTitle(result.subtitle || '')
      setContent(result.content)
      setTags((result.tags || []).join(', '))
      if (blogCategories.includes(result.category)) setCategory(result.category)
      toast.success('AI draft ready. Review and edit it before publishing.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not generate a draft. Please try again.')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleRewriteSelection = async () => {
    const input = contentInputRef.current
    if (!input || input.selectionStart === input.selectionEnd) {
      toast.error('Select a passage in the article first.')
      return
    }

    const start = input.selectionStart
    const end = input.selectionEnd
    const selectedText = content.slice(start, end)
    setRewritingAI(true)
    try {
      const { result } = await rewriteAiTextApi(selectedText)
      setContent((current) => current.slice(0, start) + result + current.slice(end))
      toast.success('Selected passage rewritten. Review it before publishing.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not rewrite this passage.')
    } finally {
      setRewritingAI(false)
    }
  }

  // Cover image upload
  const handleCoverSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingCover(true)
    const toastId = toast.loading('Uploading picture...')
    try {
      const res = await uploadImage(file)
      if (res.url) {
        setCoverImage(res.url)
        toast.success('Cover image uploaded!', { id: toastId })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed.', { id: toastId })
    } finally {
      setUploadingCover(false)
    }
  }

  // Publish
  const handlePublish = async (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in before publishing an article.')
      onRequestAuth('login')
      return
    }
    if (!title.trim()) {
      toast.error('Please provide an article title')
      return
    }
    if (!content.trim()) {
      toast.error('Please write article content')
      return
    }

    setPublishing(true)
    try {
      const article = {
        title: title.trim(),
        subtitle: subTitle.trim(),
        category: category || 'Technology',
        coverImage,
        content: content.startsWith('<') ? content : `<p>${content.replace(/\n\n/g, '</p><p>')}</p>`,
        status: 'published',
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      }
      const newBlog = articleId
        ? await onUpdateBlog(articleId, article)
        : await onAddBlog(article)
      setPublishing(false)
      toast.success(articleId ? 'Article updated.' : 'Article published to Sajilo Blog!')
      navigate(`/blog/${newBlog.slug || newBlog._id}`)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish the article. Please try again.')
      setPublishing(false)
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign in to write an article</h1>
        <p className="mt-2 text-sm text-gray-600">Every community member can write and publish after signing in.</p>
        <button
          type="button"
          onClick={() => onRequestAuth('login')}
          className="mt-6 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Sign in or create an account
        </button>
      </div>
    )
  }

  if (loadingArticle) {
    return <p className="py-16 text-center text-sm text-gray-500">Loading article...</p>
  }

  return (
    <div className="min-h-screen bg-slate-50/60 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Cancel &amp; Return
          </Link>

          <span className="text-xs text-gray-500">
            {articleId ? 'Edit this article' : 'Share a story with the community'}
          </span>
        </div>

        <section className="mb-6 rounded-3xl border border-indigo-100 bg-indigo-50/70 p-6 sm:p-8">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900">AI writing assistant</h2>
            <p className="mt-1 text-sm text-gray-600">
              Generate an editable first draft or rewrite a selected passage. Review AI output before publishing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="ai-topic" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Article topic
              </label>
              <input
                id="ai-topic"
                maxLength={300}
                value={aiTopic}
                onChange={(event) => setAiTopic(event.target.value)}
                placeholder="What should the article explore?"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ai-audience" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Intended readers
              </label>
              <input
                id="ai-audience"
                maxLength={200}
                value={aiAudience}
                onChange={(event) => setAiAudience(event.target.value)}
                placeholder="e.g. first-time travelers"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="ai-tone" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Voice
              </label>
              <select
                id="ai-tone"
                value={aiTone}
                onChange={(event) => setAiTone(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              >
                {['Warm and conversational', 'Clear and practical', 'Thoughtful and reflective', 'Professional and informative'].map((tone) => (
                  <option key={tone} value={tone}>{tone}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ai-length" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Draft length
              </label>
              <select
                id="ai-length"
                value={aiLength}
                onChange={(event) => setAiLength(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              >
                {['Concise (300-500 words)', 'Standard (600-800 words)', 'Detailed (900-1200 words)'].map((length) => (
                  <option key={length} value={length}>{length}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={generatingAI}
                className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {generatingAI ? 'Generating draft...' : 'Generate editable draft'}
              </button>
            </div>
          </div>
        </section>

        {/* Editor Card */}
        <form onSubmit={handlePublish} className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-gray-200/80 space-y-8">
          
          {/* Cover Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Article Cover Picture
            </label>

            {coverImage ? (
              <div className="relative group rounded-2xl overflow-hidden aspect-[21/9] bg-slate-100 border border-gray-200">
                <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow hover:bg-gray-100 cursor-pointer"
                  >
                    Change Picture
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => coverInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/20 transition-all cursor-pointer group"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-2 group-hover:scale-105 transition-transform">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-gray-900">
                  {uploadingCover ? 'Uploading picture...' : 'Click to upload a high-resolution cover photo'}
                </p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP supported</p>
              </div>
            )}

            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Article Title
            </label>

            <input
              type="text"
              required
              placeholder="Enter an engaging, inspiring headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 placeholder-gray-300 border-0 border-b border-gray-200 pb-3 focus:border-indigo-600 focus:outline-none focus:ring-0 leading-tight"
            />
          </div>

          {/* Subtitle / Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Subtitle / Excerpt
            </label>
            <input
              type="text"
              placeholder="Brief summary or teaser to hook readers (1-2 sentences)..."
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full text-base text-gray-700 placeholder-gray-400 border-0 border-b border-gray-200 pb-2 focus:border-indigo-600 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Category & Tags Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 focus:border-indigo-600 focus:outline-none"
              >
                {blogCategories.filter((c) => c !== 'All').map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Tags <span className="text-gray-400 font-normal">(Comma separated)</span>
              </label>
              <input
                type="text"
                placeholder="tech, future, startup, design"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Article Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Article Story / Content
              </label>
              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-gray-400 sm:inline">Supports HTML tags (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;)</span>
                <button
                  type="button"
                  onClick={handleRewriteSelection}
                  disabled={rewritingAI}
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  {rewritingAI ? 'Rewriting...' : 'Rewrite selection'}
                </button>
              </div>
            </div>

            <textarea
              ref={contentInputRef}
              rows="12"
              required
              placeholder="Write your article here... Share your knowledge, insights, and experiences with the world."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-2xl border border-gray-300 p-4 font-mono text-sm leading-relaxed text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Publish Action Bar */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Publishing as: <strong className="text-gray-900">{user?.name || 'Author'}</strong>
            </span>

            <button
              type="submit"
              disabled={publishing}
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              {publishing ? (articleId ? 'Saving...' : 'Publishing...') : (articleId ? 'Save Article Changes' : 'Publish Article Now')}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default WriteBlog
