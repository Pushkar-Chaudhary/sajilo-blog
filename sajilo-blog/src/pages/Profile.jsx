import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { uploadImage, updateProfileApi, changePasswordApi } from '../services/api'
import { blog_data } from '../assets/assets'

const Profile = ({ user, onUpdateUser, onLogout }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile') // 'profile' | 'security' | 'bookmarks'
  
  // Profile form state
  const [name, setName] = useState(user?.name || 'Alex Morgan')
  const [email] = useState(user?.email || 'alex@example.com')
  const [bio, setBio] = useState(user?.bio || 'Passionate writer, tech enthusiast, and builder exploring the intersection of AI, design, and product craftsmanship.')
  const [website, setWebsite] = useState(user?.website || 'https://alexmorgan.dev')
  const [avatar, setAvatar] = useState(user?.avatar || '')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  // Bookmarks
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('sajilo_bookmarks')
    if (saved) {
      try { return JSON.parse(saved) } catch (e) {}
    }
    return [blog_data[0]._id, blog_data[2]._id]
  })

  // Handle avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).')
      return
    }

    setUploadingAvatar(true)
    const toastId = toast.loading('Uploading picture...')
    try {
      const res = await uploadImage(file)
      if (res.url) {
        setAvatar(res.url)
        const updated = { ...user, avatar: res.url, name, bio, website }
        onUpdateUser(updated)
        toast.success('Profile picture updated!', { id: toastId })
      }
    } catch (err) {
      toast.error('Upload failed. Using local preview.', { id: toastId })
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Handle saving profile changes
  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setSavingProfile(true)
    try {
      const payload = { name: name.trim(), bio: bio.trim(), website: website.trim(), avatar }
      await updateProfileApi(payload)
      const updatedUser = { ...user, ...payload }
      onUpdateUser(updatedUser)
      toast.success('Account profile updated successfully!')
    } catch (err) {
      toast.error('Could not save changes.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Handle password change
  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword) {
      toast.error('Please enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await changePasswordApi({ currentPassword, newPassword })
      toast.success('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setSavingPassword(false)
    }
  }

  const bookmarkedBlogs = blog_data.filter((b) => bookmarks.includes(b._id))

  const removeBookmark = (id) => {
    const updated = bookmarks.filter((bId) => bId !== id)
    setBookmarks(updated)
    localStorage.setItem('sajilo_bookmarks', JSON.stringify(updated))
    toast.success('Removed from bookmarks')
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Articles
          </Link>

          <button
            onClick={() => {
              onLogout()
              navigate('/')
              toast.success('Logged out')
            }}
            className="rounded-xl border border-red-200 bg-red-50/50 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar with photo upload trigger */}
            <div className="relative group shrink-0">
              <div className="h-28 w-28 rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center text-white text-3xl font-extrabold shadow-md border-4 border-white">
                {avatar ? (
                  <img src={avatar} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span>{name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              {/* Photo Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-2xl bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                title="Change picture"
              >
                <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] font-bold">
                  {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* User Meta */}
            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{name}</h1>
                <span className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                  Verified Member
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">{email}</p>

              <p className="mt-3 text-sm text-gray-700 max-w-xl leading-relaxed">
                {bio}
              </p>

              {website && (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Quick Actions */}
            <div className="shrink-0 flex gap-2">
              <Link
                to="/write"
                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Write Post
              </Link>
            </div>

          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Edit Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              Password &amp; Security
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bookmarks'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <span>Bookmarks</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {bookmarks.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Edit Profile */}
        {activeTab === 'profile' && (
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Personal Information</h2>
            <p className="text-sm text-gray-500 mb-6">
              Update your account details and how you appear to other readers.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-gray-400 font-normal">(Read only)</span>
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Bio / About You
                  </label>
                  <span className="text-xs text-gray-400">{bio.length} / 500</span>
                </div>
                <textarea
                  rows="3"
                  maxLength="500"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio with your readers..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Website or Portfolio URL
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Security & Password */}
        {activeTab === 'security' && (
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Ensure your account is protected with a strong, unique password.
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 3: Bookmarks */}
        {activeTab === 'bookmarks' && (
          <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Saved Articles</h2>
            <p className="text-sm text-gray-500 mb-6">
              Articles you have bookmarked to read later.
            </p>

            {bookmarkedBlogs.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {bookmarkedBlogs.map((b) => (
                  <div key={b._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={b.image} alt={b.title} className="h-14 w-20 rounded-xl object-cover shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-indigo-600">{b.category}</span>
                        <Link to={`/blog/${b._id}`} className="block font-bold text-sm text-gray-900 hover:text-indigo-600 line-clamp-1">
                          {b.title}
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookmark(b._id)}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>No saved articles yet. Explore the feed and bookmark stories you love!</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default Profile
