import { useState } from 'react'
import Hero from '../components/Hero'
import BlogList from '../components/BlogList'
import { blogCategories } from '../assets/assets'

const Home = ({
  blogs,
  loading,
  error,
  onRetry,
  user,
  onToggleBookmark,
  onRequestAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  const browseFeed = (category = selectedCategory) => {
    setSelectedCategory(category)
    document.getElementById('feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      <div>
        <Hero
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={browseFeed}
          categories={blogCategories}
          onBrowse={() => browseFeed()}
        />

        <div id="feed" className="scroll-mt-20">
          <BlogList
            blogs={blogs}
            categories={blogCategories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            loading={loading}
            error={error}
            onRetry={onRetry}
            user={user}
            onToggleBookmark={onToggleBookmark}
            onRequestAuth={onRequestAuth}
          />
        </div>
      </div>
    </div>
  )
}

export default Home
