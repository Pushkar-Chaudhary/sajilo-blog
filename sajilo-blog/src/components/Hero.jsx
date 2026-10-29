const Hero = ({ searchTerm, setSearchTerm, selectedCategory, setSelectedCategory, categories, onBrowse }) => {
  return (
    <div className="relative bg-white border-b border-zinc-200/80 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Editorial Sub-badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-xs font-semibold tracking-wide text-zinc-700 mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Modern thoughts and community writing
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 leading-[1.12]">
          Stories, Ideas &amp; Perspectives <br className="hidden sm:inline" />
          for the Thoughtful Reader.
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-zinc-600 font-normal leading-relaxed">
          Read community stories on technology, startups, thoughtful living, and personal finance without an account.
          Sign in only when you want to publish, comment, or save a story.
        </p>

        {/* Search & Actions Bar */}
        <div className="mx-auto mt-9 max-w-2xl">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              onBrowse()
            }}
            className="flex items-center rounded-2xl bg-zinc-50 p-2 border border-zinc-300 shadow-sm transition-all focus-within:border-zinc-900 focus-within:bg-white"
          >
            <div className="flex items-center pl-3 text-zinc-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search topics, keywords, or articles..."
              className="w-full bg-transparent px-3 py-2 text-sm sm:text-base text-zinc-900 placeholder-zinc-400 outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-2 text-xs font-medium text-zinc-400 hover:text-zinc-900 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-zinc-400 font-semibold mr-1">Browse:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 font-semibold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900'
              }`}
            >
              {cat === 'All' ? 'All Stories' : cat}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onBrowse}
          className="mt-7 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
        >
          Read the latest stories
        </button>

      </div>
    </div>
  )
}

export default Hero
