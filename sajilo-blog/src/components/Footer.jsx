import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" className="font-bold text-gray-900">
          Sajilo <span className="text-indigo-600">Blog</span>
        </Link>
        <p className="text-gray-500">© {new Date().getFullYear()} Sajilo Blog</p>
        <div className="flex gap-5">
          <Link to="/" className="text-gray-600 hover:text-gray-900">Read</Link>
          <Link to="/write" className="text-gray-600 hover:text-gray-900">Write</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
