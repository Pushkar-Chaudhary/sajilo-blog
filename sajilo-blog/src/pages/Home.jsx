import React, { useState } from 'react'
import Hero from '../components/Hero'
import BlogList from '../components/BlogList'
import Newsletter from '../components/Newsletter'
import { blogCategories } from '../assets/assets'

const Home = ({ blogs, onOpenAiStudio }) => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
      <div>
        <Hero
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={blogCategories}
          onOpenAiStudio={onOpenAiStudio}
        />

        <BlogList
          blogs={blogs}
          categories={blogCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <Newsletter />
      </div>
    </div>
  )
}

export default Home
