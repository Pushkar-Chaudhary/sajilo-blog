import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  changePasswordApi,
  getAdminArticlesApi,
  getAdminUsersApi,
  updateProfileApi,
  updateUserRoleApi,
  uploadImage,
} from '../services/api'

const Profile = ({ user, bookmarks, onToggleBookmark, onUpdateUser, onLogout, onAdminDeleteArticle }) => {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('profile')
  
  // Profile form state
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [website, setWebsite] = useState(user?.website || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  // Loading states
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [adminUsers, setAdminUsers] = useState([])
  const [adminArticles, setAdminArticles] = useState([])
  const [loadingAdmin, setLoadingAdmin] = useState(user.role === 'admin')
  const [updatingRoleId, setUpdatingRoleId] = useState('')

  useEffect(() => {
    if (activeTab !== 'admin' || user.role !== 'admin') return undefined

    let active = true
    Promise.all([getAdminUsersApi(), getAdminArticlesApi()])
      .then(([{ users }, { articles }]) => {
        if (!active) return
        setAdminUsers(users)
        setAdminArticles(articles)
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Could not load admin tools.')
      })
      .finally(() => {
        if (active) setLoadingAdmin(false)
      })

    return () => {
      active = false
    }
  }, [activeTab, user.role])

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
        const response = await updateProfileApi({ avatar: res.url })
        setAvatar(res.url)
        onUpdateUser(response.user)
        toast.success('Profile picture updated!', { id: toastId })
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.', { id: toastId })
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
      const response = await updateProfileApi(payload)
      onUpdateUser(response.user)
      toast.success('Account profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save changes.')
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

  const handleRemoveBookmark = async (blog) => {
    try {
      await onToggleBookmark(blog)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove the saved story.')
    }
  }

  const handleToggleAdminRole = async (targetUser) => {
    const role = targetUser.role === 'admin' ? 'user' : 'admin'
    setUpdatingRoleId(targetUser._id)
    try {
      const { user: updatedUser } = await updateUserRoleApi(targetUser._id, role)
      setAdminUsers((current) => current.map((item) => (
        item._id === updatedUser._id ? updatedUser : item
      )))
      toast.success(role === 'admin' ? 'Co-admin access granted.' : 'Admin access removed.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update account role.')
    } finally {
      setUpdatingRoleId('')
    }
  }

  const handleAdminDeleteArticle = async (article) => {
    if (!window.confirm(`Delete "${article.title}" permanently?`)) return
    try {
      await onAdminDeleteArticle(article._id)
      setAdminArticles((current) => current.filter((item) => item._id !== article._id))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the article.')
    }
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
                  {user.role === 'admin' ? 'Administrator' : 'Writer'}
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
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setLoadingAdmin(true)
                  setActiveTab('admin')
                }}
                className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'admin'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Admin tools
              </button>
            )}
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
                <div className="relative">
                  <input
                    type={visiblePasswords.current ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-16 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords((visible) => ({ ...visible, current: !visible.current }))}
                    aria-label={visiblePasswords.current ? 'Hide current password' : 'Show current password'}
                    aria-pressed={visiblePasswords.current}
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    {visiblePasswords.current ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  New Password (min 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={visiblePasswords.new ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-16 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords((visible) => ({ ...visible, new: !visible.new }))}
                    aria-label={visiblePasswords.new ? 'Hide new password' : 'Show new password'}
                    aria-pressed={visiblePasswords.new}
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    {visiblePasswords.new ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={visiblePasswords.confirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-16 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePasswords((visible) => ({ ...visible, confirm: !visible.confirm }))}
                    aria-label={visiblePasswords.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                    aria-pressed={visiblePasswords.confirm}
                    className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    {visiblePasswords.confirm ? 'Hide' : 'Show'}
                  </button>
                </div>
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

            {bookmarks.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {bookmarks.map((b) => (
                  <div key={b._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img src={b.image} alt={b.title} className="h-14 w-20 rounded-xl object-cover shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-indigo-600">{b.category}</span>
                        <Link to={`/blog/${b.slug || b._id}`} className="block font-bold text-sm text-gray-900 hover:text-indigo-600 line-clamp-1">
                          {b.title}
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBookmark(b)}
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

        {activeTab === 'admin' && user.role === 'admin' && (
          <div className="space-y-8">
            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-lg font-bold text-gray-900">Co-admin access</h2>
              <p className="mt-1 mb-6 text-sm text-gray-500">
                Promote registered accounts to co-admins. Co-admins can manage articles and users.
              </p>
              {loadingAdmin ? (
                <p className="py-8 text-center text-sm text-gray-500">Loading accounts...</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {adminUsers.map((account) => (
                    <div key={account._id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{account.name}</p>
                        <p className="truncate text-xs text-gray-500">{account.email}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs font-medium text-gray-500">
                          {account.role === 'admin' ? 'Admin' : 'Writer'}
                        </span>
                        {account._id !== user._id && account.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => handleToggleAdminRole(account)}
                            disabled={updatingRoleId === account._id}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                          >
                            {updatingRoleId === account._id
                              ? 'Saving...'
                              : account.role === 'admin' ? 'Remove admin' : 'Make co-admin'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {adminUsers.length === 0 && (
                    <p className="py-6 text-sm text-gray-500">No registered accounts found.</p>
                  )}
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-200/80">
              <h2 className="text-lg font-bold text-gray-900">Manage articles</h2>
              <p className="mt-1 mb-6 text-sm text-gray-500">
                Edit or remove articles, including posts published by other writers.
              </p>
              {!loadingAdmin && (
                <div className="divide-y divide-gray-100">
                  {adminArticles.map((article) => (
                    <div key={article._id} className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{article.title}</p>
                        <p className="text-xs text-gray-500">
                          {article.status} · {article.author?.name || 'Unknown author'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Link
                          to={`/write/${article.slug}`}
                          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAdminDeleteArticle(article)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {adminArticles.length === 0 && (
                    <p className="py-6 text-sm text-gray-500">No articles found.</p>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  )
}

export default Profile
