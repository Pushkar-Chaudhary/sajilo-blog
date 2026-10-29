import BlogCard from './BlogCard'

const BlogList = ({
  blogs,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  loading,
  error,
  onRetry,
  user,
  onToggleBookmark,
  onRequestAuth,
}) => {
  // Filter blogs by category and search term
  const filteredBlogs = blogs.filter((blog) => {
    const matchesCategory =
      selectedCategory === 'All' || blog.category === selectedCategory
    const matchesSearch =
      searchTerm.trim() === '' ||
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.subTitle && blog.subTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (blog.category && blog.category.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  // Count per category
  const getCategoryCount = (category) => {
    if (category === 'All') return blogs.length
    return blogs.filter((b) => b.category === category).length
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Category Pills Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {selectedCategory === 'All' ? 'Latest Articles' : `${selectedCategory} Articles`}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? 'article' : 'articles'}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const count = getCategoryCount(category)
            const isActive = selectedCategory === category
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span>{category}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isActive ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <p className="py-16 text-center text-sm text-gray-500" role="status">Loading published stories…</p>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center" role="alert">
          <h3 className="text-base font-semibold text-red-900">Stories are temporarily unavailable</h3>
          <p className="mt-2 text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Try again
          </button>
        </div>
      ) : filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog._id}
              blog={blog}
              user={user}
              onToggleBookmark={onToggleBookmark}
              onRequestAuth={onRequestAuth}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {blogs.length === 0 ? 'No stories published yet' : 'No articles found'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {blogs.length === 0
              ? 'Be the first writer to share a story with the community.'
              : "We couldn't find any articles matching your search criteria."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Clear Search
              </button>
            )}
            {selectedCategory !== 'All' && (
              <button
                onClick={() => setSelectedCategory('All')}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                View All Categories
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default BlogList
