import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { analyzeImageWithAi, generateAiArticle, rewriteAiText } from '../services/api'

const AiStudio = ({ isOpen, onClose, onUseDraft }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('vision') // 'vision' | 'writer' | 'rewrite'

  // Vision state
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [analyzingImage, setAnalyzingImage] = useState(false)
  const [visionResult, setVisionResult] = useState(null)

  // Article writer state
  const [topic, setTopic] = useState('')
  const [tone, setTone] = useState('Engaging')
  const [category, setCategory] = useState('Technology')
  const [generatingArticle, setGeneratingArticle] = useState(false)
  const [generatedDraft, setGeneratedDraft] = useState(null)

  // Rewriter state
  const [rawText, setRawText] = useState('')
  const [instruction, setInstruction] = useState('Make it more engaging and professional')
  const [rewriting, setRewriting] = useState(false)
  const [rewrittenText, setRewrittenText] = useState('')

  if (!isOpen) return null

  // Handle image selection & AI analysis
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedImage(file)
    setImagePreview(URL.createObjectURL(file))
    setAnalyzingImage(true)
    setVisionResult(null)

    const toastId = toast.loading('AI is analyzing your image & generating article ideas...')
    try {
      const res = await analyzeImageWithAi(file)
      if (res.ai) {
        setVisionResult({ ...res.ai, imageUrl: res.url })
        toast.success('Visual analysis complete!', { id: toastId })
      }
    } catch (err) {
      toast.error('AI analysis encountered an error.', { id: toastId })
    } finally {
      setAnalyzingImage(false)
    }
  }

  // Handle AI Article generation
  const handleGenerateArticle = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      toast.error('Please enter an article topic')
      return
    }

    setGeneratingArticle(true)
    const toastId = toast.loading('Gemini AI is crafting your article...')
    try {
      const res = await generateAiArticle({ topic, tone, category })
      if (res.result) {
        setGeneratedDraft(res.result)
        toast.success('Article drafted successfully!', { id: toastId })
      }
    } catch (err) {
      toast.error('Failed to generate draft.', { id: toastId })
    } finally {
      setGeneratingArticle(false)
    }
  }

  // Handle text rewrite
  const handleRewrite = async (e) => {
    e.preventDefault()
    if (!rawText.trim()) {
      toast.error('Please enter text to rewrite')
      return
    }

    setRewriting(true)
    const toastId = toast.loading('Polishing with AI...')
    try {
      const result = await rewriteAiText(rawText, instruction)
      setRewrittenText(result)
      toast.success('Polished with AI!', { id: toastId })
    } catch (err) {
      toast.error('Rewrite failed.', { id: toastId })
    } finally {
      setRewriting(false)
    }
  }

  // Open Write page with generated content
  const handleUseVisionStory = () => {
    if (!visionResult) return
    const draftData = {
      title: visionResult.suggestedTitle,
      category: visionResult.suggestedCategory || 'Technology',
      coverImage: visionResult.imageUrl || imagePreview,
      content: `<p>${visionResult.storyHook}</p><p>As we examine this visual closer, several transformative themes emerge...</p>`,
      tags: visionResult.tags || [],
    }
    if (onUseDraft) {
      onUseDraft(draftData)
    }
    onClose()
    navigate('/write', { state: { draft: draftData } })
  }

  const handleUseWriterDraft = () => {
    if (!generatedDraft) return
    const fullHtml = `
      <p class="lead">${generatedDraft.introduction || ''}</p>
      ${(generatedDraft.sections || []).map((s) => `<h2>${s.heading}</h2>${s.content}`).join('')}
      <h2>Conclusion</h2>
      <p>${generatedDraft.conclusion || ''}</p>
    `
    const draftData = {
      title: generatedDraft.title,
      subTitle: generatedDraft.subtitle,
      category,
      content: fullHtml,
      tags: generatedDraft.tags || [],
    }
    if (onUseDraft) {
      onUseDraft(draftData)
    }
    onClose()
    navigate('/write', { state: { draft: draftData } })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-gray-100 z-10 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <span>Gemini AI Creative Studio</span>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 uppercase">
                  Powered by 1.5 Flash
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Transform pictures into articles, generate complete drafts, and polish prose in seconds.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Studio Tabs */}
        <div className="flex rounded-2xl bg-gray-100 p-1.5 my-6 gap-1">
          <button
            onClick={() => setActiveTab('vision')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'vision'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Picture-to-Story Vision
          </button>

          <button
            onClick={() => setActiveTab('writer')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'writer'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            AI Article Generator
          </button>

          <button
            onClick={() => setActiveTab('rewrite')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'rewrite'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Prose Polisher
          </button>
        </div>

        {/* Tab 1: Vision Photo to Story */}
        {activeTab === 'vision' && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 max-w-lg mx-auto">
                Upload any picture or photo. Gemini AI will analyze what is inside, create a viral headline, determine the category, and write an opening narrative hook.
              </p>
            </div>

            {/* Upload Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-8 text-center hover:bg-indigo-50/60 transition-all cursor-pointer group"
            >
              {imagePreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="h-48 w-auto rounded-xl object-cover shadow-md mb-3 border border-indigo-100"
                  />
                  <span className="text-xs font-semibold text-indigo-600 group-hover:underline">
                    Click to choose a different picture
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm text-indigo-600 mb-3 group-hover:scale-105 transition-transform">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Upload a picture to inspect</h4>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {analyzingImage && (
              <div className="rounded-2xl bg-indigo-50/50 p-6 text-center border border-indigo-100 animate-pulse">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3"></div>
                <p className="text-sm font-bold text-indigo-900">Analyzing visual features with Gemini Vision...</p>
                <p className="text-xs text-indigo-600">Extracting themes, mood, and headline ideas</p>
              </div>
            )}

            {/* Vision AI Output */}
            {visionResult && !analyzingImage && (
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    {visionResult.suggestedCategory || 'Story'}
                  </span>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> AI Vision Ready
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-gray-900">{visionResult.suggestedTitle}</h3>
                  <p className="mt-2 text-sm text-gray-700 italic border-l-2 border-indigo-400 pl-3">
                    "{visionResult.storyHook}"
                  </p>
                </div>

                {visionResult.tags && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {visionResult.tags.map((t, idx) => (
                      <span key={idx} className="rounded-md bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600 font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleUseVisionStory}
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-gray-800 transition-colors"
                  >
                    <span>Write Article with this Image</span>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Article Writer */}
        {activeTab === 'writer' && (
          <div className="space-y-6">
            <form onSubmit={handleGenerateArticle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Article Topic or Idea
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How Autonomous AI Agents Will Reshape Web Development by 2027"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Startup">Startup</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Tone of Voice
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="Engaging">Engaging &amp; Dynamic</option>
                    <option value="Professional">Professional &amp; Authoritative</option>
                    <option value="Casual">Casual &amp; Conversational</option>
                    <option value="Technical">Technical &amp; In-depth</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={generatingArticle}
                className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {generatingArticle ? 'Crafting Complete Article Draft...' : 'Generate Full Article with AI'}
              </button>
            </form>

            {generatedDraft && (
              <div className="rounded-2xl border border-gray-200 bg-slate-50 p-6 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">{generatedDraft.title}</h3>
                {generatedDraft.subtitle && (
                  <p className="text-sm font-medium text-gray-600">{generatedDraft.subtitle}</p>
                )}
                <div
                  className="max-h-48 overflow-y-auto text-xs text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: generatedDraft.introduction }}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleUseWriterDraft}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    Load into Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Prose Polisher */}
        {activeTab === 'rewrite' && (
          <form onSubmit={handleRewrite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Draft Content to Polish
              </label>
              <textarea
                rows="4"
                required
                placeholder="Paste any paragraph or section here..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Instruction
              </label>
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. Make it punchier, improve flow, fix grammar"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={rewriting}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {rewriting ? 'Polishing...' : 'Polish with AI'}
            </button>

            {rewrittenText && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800">AI Improved Version</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(rewrittenText)
                      toast.success('Copied to clipboard!')
                    }}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    Copy Text
                  </button>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed">{rewrittenText}</p>
              </div>
            )}
          </form>
        )}

      </div>
    </div>
  )
}

export default AiStudio
