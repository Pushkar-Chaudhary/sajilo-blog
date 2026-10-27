import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadImage, analyzeImageWithAi, generateAiTitles } from '../services/api'
import { blogCategories } from '../assets/assets'

const WriteBlog = ({ onAddBlog, user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const coverInputRef = useRef(null)

  // Pre-fill if redirected from AI Studio
  const prefill = location.state?.draft

  const [title, setTitle] = useState(prefill?.title || '')
  const [subTitle, setSubTitle] = useState(prefill?.subTitle || '')
  const [category, setCategory] = useState(prefill?.category || 'Technology')
  const [coverImage, setCoverImage] = useState(prefill?.coverImage || '')
  const [content, setContent] = useState(prefill?.content || '')
  const [tags, setTags] = useState(prefill?.tags?.join(', ') || '')

  const [uploadingCover, setUploadingCover] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [suggestingTitles, setSuggestingTitles] = useState(false)
  const [titleOptions, setTitleOptions] = useState([])
  const [publishing, setPublishing] = useState(false)

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
    } catch (err) {
      toast.error('Upload failed.', { id: toastId })
    } finally {
      setUploadingCover(false)
    }
  }

  // AI Vision analysis directly from cover image
  const handleAiVisionFromCover = async () => {
    if (!coverImage) {
      toast.error('Please upload a cover picture first.')
      return
    }

    setAiAnalyzing(true)
    const toastId = toast.loading('AI is analyzing the picture...')
    try {
      // If cover is data url, create blob
      const res = await fetch(coverImage)
      const blob = await res.blob()
      const file = new File([blob], 'cover.jpg', { type: blob.type })
      const aiRes = await analyzeImageWithAi(file)

      if (aiRes.ai) {
        if (!title) setTitle(aiRes.ai.suggestedTitle)
        if (!category && aiRes.ai.suggestedCategory) setCategory(aiRes.ai.suggestedCategory)
        if (aiRes.ai.tags) setTags(aiRes.ai.tags.join(', '))
        if (!content) {
          setContent(`<p class="lead">${aiRes.ai.storyHook}</p><h2>Key Perspectives</h2><p>Here is what makes this topic particularly relevant today...</p>`)
        }
        toast.success('AI populated title, category, tags & hook from your image!', { id: toastId })
      }
    } catch (err) {
      toast.error('AI vision analysis failed.', { id: toastId })
    } finally {
      setAiAnalyzing(false)
    }
  }

  // Suggest titles with Gemini AI
  const handleSuggestTitles = async () => {
    const textContext = title || content
    if (!textContext.trim()) {
      toast.error('Please write some content or enter a rough title first.')
      return
    }

    setSuggestingTitles(true)
    const toastId = toast.loading('AI is generating title variations...')
    try {
      const titles = await generateAiTitles(textContext)
      setTitleOptions(titles)
      toast.success('Generated title ideas!', { id: toastId })
    } catch (err) {
      toast.error('Could not generate titles.', { id: toastId })
    } finally {
      setSuggestingTitles(false)
    }
  }

  // Publish
  const handlePublish = (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please provide an article title')
      return
    }
    if (!content.trim()) {
      toast.error('Please write article content')
      return
    }

    setPublishing(true)

    const newBlog = {
      _id: 'blog_' + Date.now().toString(),
      title: title.trim(),
      subTitle: subTitle.trim() || title.trim(),
      category: category || 'Technology',
      image: coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
      description: content.startsWith('<') ? content : `<p>${content.replace(/\n\n/g, '</p><p>')}</p>`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublished: true,
      author: user?.name || 'Editorial Team',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    setTimeout(() => {
      onAddBlog(newBlog)
      setPublishing(false)
      toast.success('Article published to Sajilo Blog!')
      navigate(`/blog/${newBlog._id}`)
    }, 600)
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

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              Draft Auto-Saved
            </span>
          </div>
        </div>

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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-gray-900 shadow hover:bg-gray-100 cursor-pointer"
                  >
                    Change Picture
                  </button>
                  <button
                    type="button"
                    onClick={handleAiVisionFromCover}
                    disabled={aiAnalyzing}
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-zinc-800 cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {aiAnalyzing ? 'Analyzing...' : 'AI Story from Picture'}
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

          {/* Title with AI Suggestion Button */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Article Title
              </label>
              <button
                type="button"
                onClick={handleSuggestTitles}
                disabled={suggestingTitles}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {suggestingTitles ? 'Thinking...' : 'AI Suggest Headlines'}
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Enter an engaging, inspiring headline..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 placeholder-gray-300 border-0 border-b border-gray-200 pb-3 focus:border-indigo-600 focus:outline-none focus:ring-0 leading-tight"
            />

            {titleOptions.length > 0 && (
              <div className="mt-3 rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-900 mb-2">AI Suggested Headlines (Click to use):</p>
                <div className="space-y-1.5">
                  {titleOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTitle(opt)}
                      className="block w-full text-left text-xs text-indigo-800 hover:bg-indigo-100/70 p-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      • {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <span className="text-xs text-gray-400">Supports HTML tags (&lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;)</span>
            </div>

            <textarea
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
              {publishing ? 'Publishing...' : 'Publish Article Now'}
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
