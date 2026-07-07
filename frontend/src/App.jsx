import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, DollarSign,
  Bell, LogOut, Menu, X, ChevronDown, School, Bus, BookOpen,
  Calendar, Settings, BarChart3, FileText, Search, CheckCircle2,
  XCircle, Clock, AlertTriangle, TrendingUp, Eye, Plus, Activity,
  Check, UserPlus, Briefcase
} from 'lucide-react'

const AuthContext = createContext(null)
const CampusContext = createContext(null)

function useAuth() {
  return useContext(AuthContext)
}

function useCampus() {
  return useContext(CampusContext)
}

function api() {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const instance = axios.create({
    baseURL: baseURL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    timeout: 30000
  })
  instance.interceptors.response.use(
    response => response,
    async error => {
      if (error.response?.status === 429) {
        await new Promise(r => setTimeout(r, 3000))
        return instance.request(error.config)
      }
      return Promise.reject(error)
    }
  )
  return instance
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })
}

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function LoginPage() {
  const [email, setEmail] = useState('admin@regal.school')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await axios.post(`${apiBase}/auth/login`, { email, password })
      login(res.data.data)
      navigate(res.data.data.user.role === 'parent' ? '/parent' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Regal School System</h1>
          <p className="text-gray-500 text-sm mt-1">Taxila, Pakistan</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">Demo Accounts:</p>
          <div className="space-y-1">
            <p><strong>Super Admin:</strong> admin@regal.school / admin123</p>
            <p><strong>Campus Admin:</strong> khanpur.admin@regal.school / admin123</p>
            <p><strong>Teacher:</strong> ahmed@regal.school / teacher123</p>
            <p><strong>Accountant:</strong> ali@regal.school / account123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ collapsed, setCollapsed }) {
  const { user } = useAuth()
  const location = useLocation()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['super_admin', 'campus_admin', 'teacher', 'accountant'] },
    { icon: Users, label: 'Students', path: '/students', roles: ['super_admin', 'campus_admin', 'teacher'] },
    { icon: GraduationCap, label: 'Classes', path: '/classes', roles: ['super_admin', 'campus_admin', 'teacher'] },
    { icon: Briefcase, label: 'Teachers', path: '/teachers', roles: ['super_admin', 'campus_admin'] },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance', roles: ['super_admin', 'campus_admin', 'teacher'] },
    { icon: DollarSign, label: 'Finance', path: '/finance', roles: ['super_admin', 'campus_admin', 'accountant'] },
    { icon: Bell, label: 'Announcements', path: '/announcements', roles: ['super_admin', 'campus_admin', 'teacher'] },
    { icon: Activity, label: 'Notifications', path: '/notifications', roles: ['super_admin', 'campus_admin', 'teacher', 'accountant'] },
    { icon: FileText, label: 'Exams', path: '/exams', roles: ['super_admin', 'campus_admin', 'teacher'] },
    { icon: Users, label: 'My Children', path: '/parent', roles: ['parent'] },
  ]

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.role))

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <aside className={`bg-gray-900 text-white transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm">Regal School</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {filteredMenu.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function Header() {
  const { user, logout } = useAuth()
  const { selectedCampus, setSelectedCampus } = useCampus()
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifDrop, setShowNotifDrop] = useState(false)
  const [notifList, setNotifList] = useState([])

  const fetchNotifications = () => {
    api().get('/notifications').then(res => {
      setUnreadCount(res.data.unread_count)
    }).catch(() => {})
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const openNotifDrop = () => {
    setShowNotifDrop(!showNotifDrop)
    if (!showNotifDrop) {
      api().get('/notifications?limit=10').then(res => {
        setNotifList(res.data.data || [])
      }).catch(() => {})
    }
  }

  useEffect(() => {
    if (!showNotifDrop) return
    const handler = (e) => {
      if (!e.target.closest('[data-notif-drop]')) setShowNotifDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifDrop])

  const markRead = (id) => {
    api().put(`/notifications/${id}/read`).then(() => {
      setNotifList(notifList.map(n => n.id === id ? { ...n, is_read: 1 } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    }).catch(() => {})
  }

  const markAllRead = () => {
    api().put('/notifications/read-all').then(() => {
      setNotifList(notifList.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    }).catch(() => {})
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between relative">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500">{user?.campus_name || 'All Campuses'}</p>
      </div>
      <div className="flex items-center gap-3">
        <select
          className="input-field w-auto text-sm py-1.5 pr-8 border-blue-300 focus:border-blue-500 bg-blue-50"
          value={selectedCampus || ''}
          onChange={e => setSelectedCampus(e.target.value ? parseInt(e.target.value) : null)}
        >
          <option value="">All Campuses</option>
          <option value="1">Khanpur Road</option>
          <option value="2">UET Campus</option>
        </select>
        <div className="relative" data-notif-drop>
          <button onClick={openNotifDrop} className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotifDrop && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800">Mark all read</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifList.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-6">No notifications</p>
                ) : notifList.map(n => (
                  <div key={n.id} onClick={() => markRead(n.id)} className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50'}`}>
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString('en-PK')}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t text-center">
                <button onClick={() => { setShowNotifDrop(false); navigate('/notifications') }} className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All Notifications</button>
              </div>
            </div>
          )}
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-gray-700">{new Date().toLocaleDateString('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p className="text-xs text-gray-500">{new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}

function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { selectedCampus } = useCampus()

  useEffect(() => {
    setLoading(true)
    const params = selectedCampus ? { campus_id: selectedCampus } : {}
    api().get('/dashboard', { params }).then(res => {
      setData(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [selectedCampus])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
  if (!data) return <div className="text-center py-10 text-gray-500">Failed to load dashboard</div>

  const { stats, recentStudents, announcements, monthlyAttendance, campusStats } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalClasses}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Teachers</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance Today</p>
              <p className="text-3xl font-bold text-gray-800">{stats.attendanceRate}%</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {campusStats && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Campus Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campusStats.map((campus, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{campus.name}</p>
                  <p className="text-sm text-gray-500">{campus.students} students &middot; {campus.teachers} teachers</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Attendance Overview (Last 6 Months)</h3>
          {monthlyAttendance.length > 0 ? (
            <div className="space-y-3">
              {monthlyAttendance.map((m, i) => {
                const pct = m.total > 0 ? (m.present_count / m.total * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-20 text-gray-600">{m.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{pct.toFixed(0)}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No attendance data yet</p>
          )}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Fee Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-green-600">Collected</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(stats.feeSummary?.paid || 0)}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm text-red-600">Pending</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(stats.feeSummary?.pending || 0)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center pt-2 border-t">
              <p className="text-sm text-gray-500">Collection Rate</p>
              <p className="text-xl font-bold">
                {stats.feeSummary?.total > 0 ? ((stats.feeSummary.paid / stats.feeSummary.total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Admissions</h3>
          <div className="space-y-3">
            {recentStudents.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                    {s.first_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.first_name} {s.last_name}</p>
                    <p className="text-xs text-gray-500">{s.student_id} &middot; {s.class_name}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{formatDate(s.admission_date)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Announcements</h3>
          <div className="space-y-3">
            {announcements.length > 0 ? announcements.map((a, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    a.type === 'urgent' ? 'bg-red-100 text-red-700' :
                    a.type === 'holiday' ? 'bg-purple-100 text-purple-700' :
                    a.type === 'event' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {a.type}
                  </span>
                </div>
                <p className="text-sm font-medium">{a.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
              </div>
            )) : <p className="text-gray-500 text-sm">No announcements</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StudentFormModal({ show, onClose, onSave, student, classes }) {
  const { user } = useAuth()
  const [campuses, setCampuses] = useState([])
  const [sections, setSections] = useState([])
  const [form, setForm] = useState({
    first_name: '', last_name: '', father_name: '', father_cnic: '', b_form_number: '',
    date_of_birth: '', gender: 'male', blood_group: '', address: '', city: 'Taxila',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relation: '',
    admission_date: new Date().toISOString().split('T')[0], class_id: '', section_id: '',
    campus_id: user?.campus_id || '', previous_school: ''
  })

  useEffect(() => {
    api().get('/classes').then(r => {})
    if (user?.role === 'super_admin') {
      axios.get('/api/classes').then(r => {})
    }
  }, [])

  useEffect(() => {
    if (form.class_id) {
      api().get(`/classes/${form.class_id}/sections`).then(r => setSections(r.data.data))
    }
  }, [form.class_id])

  useEffect(() => {
    if (student) {
      setForm({
        first_name: student.first_name || '', last_name: student.last_name || '',
        father_name: student.father_name || '', father_cnic: student.father_cnic || '',
        b_form_number: student.b_form_number || '', date_of_birth: student.date_of_birth || '',
        gender: student.gender || 'male', blood_group: student.blood_group || '',
        address: student.address || '', city: student.city || 'Taxila',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_phone: student.emergency_contact_phone || '',
        emergency_contact_relation: student.emergency_contact_relation || '',
        admission_date: student.admission_date || new Date().toISOString().split('T')[0],
        class_id: student.class_id || '', section_id: student.section_id || '',
        campus_id: student.campus_id || user?.campus_id || '',
        previous_school: student.previous_school || ''
      })
    }
  }, [student])

  const handleSubmit = (e) => {
    e.preventDefault()
    const submitData = { ...form }
    if (!submitData.campus_id) submitData.campus_id = 1
    if (submitData.class_id === '') delete submitData.class_id
    if (submitData.section_id === '') delete submitData.section_id
    onSave(submitData)
  }

  if (!show) return null

  const filteredClasses = classes?.filter(c => {
    if (user?.role === 'super_admin') {
      if (form.campus_id && form.campus_id !== '') {
        return c.campus_id === parseInt(form.campus_id)
      }
      return true
    }
    if (user?.campus_id) {
      return c.campus_id === user.campus_id
    }
    return true
  }) || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl my-4">
        <h3 className="text-lg font-bold mb-4">{student ? 'Edit Student' : 'Add New Student'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {user?.role === 'super_admin' && (
              <div>
                <label className="label">Campus *</label>
                <select className="input-field" value={form.campus_id} onChange={e => setForm({...form, campus_id: e.target.value, class_id: '', section_id: ''})} required>
                  <option value="">Select Campus</option>
                  <option value="1">Khanpur Road</option>
                  <option value="2">UET Campus</option>
                </select>
              </div>
            )}
            <div>
              <label className="label">First Name *</label>
              <input className="input-field" value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input-field" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Father's Name *</label>
              <input className="input-field" value={form.father_name} onChange={e => setForm({...form, father_name: e.target.value})} required />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Father CNIC</label>
              <input className="input-field" value={form.father_cnic} onChange={e => setForm({...form, father_cnic: e.target.value})} placeholder="35202-XXXXXXX-X" />
            </div>
            <div>
              <label className="label">B-Form Number</label>
              <input className="input-field" value={form.b_form_number} onChange={e => setForm({...form, b_form_number: e.target.value})} />
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input-field" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})} />
            </div>
            <div>
              <label className="label">Blood Group</label>
              <select className="input-field" value={form.blood_group} onChange={e => setForm({...form, blood_group: e.target.value})}>
                <option value="">Select</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="label">Class *</label>
              <select className="input-field" value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value, section_id: ''})} required>
                <option value="">Select Class</option>
                {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Section</label>
              <select className="input-field" value={form.section_id} onChange={e => setForm({...form, section_id: e.target.value})}>
                <option value="">Select Section</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Admission Date *</label>
              <input type="date" className="input-field" value={form.admission_date} onChange={e => setForm({...form, admission_date: e.target.value})} required />
            </div>
            <div className="col-span-2">
              <label className="label">Address</label>
              <input className="input-field" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Full address" />
            </div>
            <div>
              <label className="label">Emergency Contact Name</label>
              <input className="input-field" value={form.emergency_contact_name} onChange={e => setForm({...form, emergency_contact_name: e.target.value})} />
            </div>
            <div>
              <label className="label">Emergency Contact Phone</label>
              <input className="input-field" value={form.emergency_contact_phone} onChange={e => setForm({...form, emergency_contact_phone: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="label">Previous School</label>
              <input className="input-field" value={form.previous_school} onChange={e => setForm({...form, previous_school: e.target.value})} />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{student ? 'Update Student' : 'Add Student'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [meta, setMeta] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editStudent, setEditStudent] = useState(null)
  const [classes, setClasses] = useState([])
  const [message, setMessage] = useState('')
  const { selectedCampus } = useCampus()

  const loadStudents = (page = 1) => {
    const params = { search, page, limit: 15 }
    if (selectedCampus) params.campus_id = selectedCampus
    api().get('/students', { params }).then(res => {
      setStudents(res.data.data)
      setMeta(res.data.meta)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadStudents(); api().get('/classes').then(r => setClasses(r.data.data)) }, [selectedCampus])

  const handleSearch = (e) => { e.preventDefault(); loadStudents(1) }

  const handleSave = (form) => {
    const method = editStudent ? 'put' : 'post'
    const url = editStudent ? `/students/${editStudent.id}` : '/students'
    api()[method](url, form).then(res => {
      setMessage(editStudent ? 'Student updated!' : 'Student added!')
      setShowForm(false)
      setEditStudent(null)
      loadStudents()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => {
      alert(err.response?.data?.message || 'Error saving student')
    })
  }

  const handleDelete = (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return
    api().delete(`/students/${id}`).then(() => {
      setMessage('Student deleted!')
      loadStudents()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const handleEdit = (student) => {
    setEditStudent(student)
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Students Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{meta.total || 0} students</span>
          <button onClick={() => { setEditStudent(null); setShowForm(true) }} className="btn-primary">
            <Plus className="w-4 h-4 mr-1 inline" /> Add Student
          </button>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('deleted') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search by ID, name, or father's name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">Search</button>
        </form>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Father's Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3">Parent Phone</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-500">No students found</td></tr>
              ) : students.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{s.student_id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                        {s.first_name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{s.first_name} {s.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.father_name}</td>
                  <td className="px-4 py-3 text-sm">{s.class_name}</td>
                  <td className="px-4 py-3 text-sm">{s.section_name}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{s.campus_name?.split(' - ')[1]}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.parent_phone}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {meta.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: meta.pages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => loadStudents(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-medium ${meta.page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <StudentFormModal show={showForm} onClose={() => { setShowForm(false); setEditStudent(null) }} onSave={handleSave} student={editStudent} classes={classes} />
    </div>
  )
}

function ClassFormModal({ show, onClose, onSave, cls }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: '', slug: '', level: 'primary', monthly_fee: '', admission_fee: '',
    exam_fee: '', max_students: '40', campus_id: ''
  })

  useEffect(() => {
    if (cls) {
      setForm({
        name: cls.name || '', slug: cls.slug || '', level: cls.level || 'primary',
        monthly_fee: cls.monthly_fee || '', admission_fee: cls.admission_fee || '',
        exam_fee: cls.exam_fee || '', max_students: cls.max_students || '40',
        campus_id: cls.campus_id || ''
      })
    }
  }, [cls])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...form, monthly_fee: parseFloat(form.monthly_fee) || 0, admission_fee: parseFloat(form.admission_fee) || 0, exam_fee: parseFloat(form.exam_fee) || 0, max_students: parseInt(form.max_students) || 40 })
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg my-4">
        <h3 className="text-lg font-bold mb-4">{cls ? 'Edit Class' : 'Add New Class'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {user?.role === 'super_admin' && (
            <div>
              <label className="label">Campus</label>
              <select className="input-field" value={form.campus_id} onChange={e => setForm({...form, campus_id: e.target.value})}>
                <option value="">Select Campus</option>
                <option value="1">Khanpur Road</option>
                <option value="2">UET Campus</option>
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Class Name *</label>
              <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Class 1" />
            </div>
            <div>
              <label className="label">Slug</label>
              <input className="input-field" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} placeholder="e.g. class-1" />
            </div>
            <div>
              <label className="label">Level</label>
              <select className="input-field" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                <option value="montessori">Montessori</option>
                <option value="primary">Primary</option>
                <option value="middle">Middle</option>
                <option value="high">High</option>
                <option value="college">College</option>
              </select>
            </div>
            <div>
              <label className="label">Max Students</label>
              <input type="number" className="input-field" value={form.max_students} onChange={e => setForm({...form, max_students: e.target.value})} min="1" />
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Fee Settings</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Monthly Fee (PKR)</label>
                <input type="number" className="input-field" value={form.monthly_fee} onChange={e => setForm({...form, monthly_fee: e.target.value})} min="0" />
              </div>
              <div>
                <label className="label">Admission Fee (PKR)</label>
                <input type="number" className="input-field" value={form.admission_fee} onChange={e => setForm({...form, admission_fee: e.target.value})} min="0" />
              </div>
              <div>
                <label className="label">Exam Fee (PKR)</label>
                <input type="number" className="input-field" value={form.exam_fee} onChange={e => setForm({...form, exam_fee: e.target.value})} min="0" />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{cls ? 'Update Class' : 'Add Class'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionManagementModal({ show, onClose, cls }) {
  const [sections, setSections] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTeacherId, setNewTeacherId] = useState('')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editTeacherId, setEditTeacherId] = useState('')
  const [message, setMessage] = useState('')

  const loadSections = () => {
    if (!cls?.id) return
    setLoading(true)
    api().get(`/classes/${cls.id}/sections`).then(res => {
      setSections(res.data.data || [])
    }).catch(() => setSections([])).finally(() => setLoading(false))
  }

  const loadTeachers = () => {
    api().get('/teachers').then(res => {
      setTeachers(res.data.data || [])
    }).catch(() => setTeachers([]))
  }

  useEffect(() => {
    if (show && cls) {
      loadSections()
      loadTeachers()
      setNewName('')
      setNewTeacherId('')
      setEditId(null)
      setEditName('')
      setEditTeacherId('')
      setMessage('')
    }
  }, [show, cls])

  const addSection = () => {
    if (!newName.trim()) return
    api().post(`/classes/${cls.id}/sections`, { name: newName.trim(), teacher_id: newTeacherId || null }).then(() => {
      setNewName('')
      setNewTeacherId('')
      setMessage('Section added!')
      loadSections()
      setTimeout(() => setMessage(''), 2000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const updateSection = (sectionId) => {
    if (!editName.trim()) return
    api().put(`/classes/${cls.id}/sections/${sectionId}`, { name: editName.trim(), teacher_id: editTeacherId || null }).then(() => {
      setEditId(null)
      setEditName('')
      setEditTeacherId('')
      setMessage('Section updated!')
      loadSections()
      setTimeout(() => setMessage(''), 2000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const deleteSection = (sectionId, sectionName) => {
    if (!confirm(`Delete section "${sectionName}"?`)) return
    api().delete(`/classes/${cls.id}/sections/${sectionId}`).then(() => {
      setMessage('Section deleted!')
      loadSections()
      setTimeout(() => setMessage(''), 2000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Sections - {cls?.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {message && <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm mb-3">{message}</div>}

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Add New Section</p>
          <div className="flex gap-2 mb-2">
            <input className="input-field flex-1" placeholder="Section name (A, B, C...)" value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSection()} />
            <button onClick={addSection} className="btn-primary px-4"><Plus className="w-4 h-4" /></button>
          </div>
          <select className="input-field w-full" value={newTeacherId} onChange={e => setNewTeacherId(e.target.value)}>
            <option value="">Assign Teacher (optional)</option>
            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500">Loading...</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">No sections yet. Add one above.</div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sections.map(sec => (
              <div key={sec.id} className="bg-gray-50 rounded-lg px-4 py-3">
                {editId === sec.id ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input className="input-field flex-1 py-1.5" value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                      <button onClick={() => updateSection(sec.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Save"><Check className="w-4 h-4" /></button>
                      <button onClick={() => { setEditId(null); setEditName(''); setEditTeacherId('') }} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg" title="Cancel"><X className="w-4 h-4" /></button>
                    </div>
                    <select className="input-field w-full py-1.5" value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)}>
                      <option value="">No Teacher</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{sec.name}</span>
                        <span className="text-xs text-gray-500">{sec.student_count || 0} students</span>
                      </div>
                      {sec.teacher_name && (
                        <p className="text-xs text-blue-600 mt-0.5">Teacher: {sec.teacher_name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditId(sec.id); setEditName(sec.name); setEditTeacherId(sec.teacher_id || '') }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => deleteSection(sec.id, sec.name)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-4 pt-3 border-t">
          <button onClick={onClose} className="btn-secondary px-6">Done</button>
        </div>
      </div>
    </div>
  )
}

function ClassesPage() {
  const { user } = useAuth()
  const { selectedCampus } = useCampus()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editClass, setEditClass] = useState(null)
  const [message, setMessage] = useState('')
  const [showSections, setShowSections] = useState(null)

  const loadClasses = () => {
    api().get('/classes').then(res => {
      setClasses(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadClasses() }, [])

  const handleSave = (form) => {
    const method = editClass ? 'put' : 'post'
    const url = editClass ? `/classes/${editClass.id}` : '/classes'
    api()[method](url, form).then(() => {
      setMessage(editClass ? 'Class updated successfully!' : 'Class added successfully!')
      setShowForm(false)
      setEditClass(null)
      loadClasses()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error saving class'))
  }

  const handleDelete = (cls) => {
    if (!confirm(`Delete "${cls.name}"? ${cls.student_count} student(s) enrolled.`)) return
    api().delete(`/classes/${cls.id}`).then(() => {
      setMessage('Class deleted!')
      loadClasses()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error deleting class'))
  }

  const canEdit = ['super_admin', 'campus_admin', 'teacher', 'accountant'].includes(user?.role)

  const filteredClasses = selectedCampus ? classes.filter(c => c.campus_id === selectedCampus) : classes

  const levelColors = {
    montessori: 'bg-pink-100 text-pink-700',
    primary: 'bg-blue-100 text-blue-700',
    middle: 'bg-green-100 text-green-700',
    high: 'bg-purple-100 text-purple-700',
    college: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{filteredClasses.length} classes</span>
          {canEdit && (
            <button onClick={() => { setEditClass(null); setShowForm(true) }} className="btn-primary">
              <Plus className="w-4 h-4 mr-1 inline" /> Add Class
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('deleted') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClasses.map(cls => (
            <div key={cls.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.campus_name}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelColors[cls.level] || 'bg-gray-100 text-gray-700'}`}>
                    {cls.level}
                  </span>
                  {canEdit && (
                    <>
                      <button onClick={() => { setEditClass(cls); setShowForm(true) }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(cls)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mt-4">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-blue-600">{cls.student_count}</p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{formatCurrency(cls.monthly_fee)}</p>
                  <p className="text-xs text-gray-500">Monthly Fee</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-purple-600">{cls.max_students}</p>
                  <p className="text-xs text-gray-500">Capacity</p>
                </div>
              </div>
              {canEdit && (
                <button onClick={() => setShowSections(cls)} className="w-full mt-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors">
                  Manage Sections
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ClassFormModal show={showForm} onClose={() => { setShowForm(false); setEditClass(null) }} onSave={handleSave} cls={editClass} />
      <SectionManagementModal show={!!showSections} onClose={() => setShowSections(null)} cls={showSections} />
    </div>
  )
}

function AttendancePage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [summary, setSummary] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { selectedCampus } = useCampus()

  const loadAttendance = () => {
    setLoading(true)
    const params = { date }
    if (selectedCampus) params.campus_id = selectedCampus
    api().get('/attendance/today', { params }).then(res => {
      setRecords(res.data.data.map(r => ({
        ...r,
        status: r.status || 'absent',
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAttendance() }, [selectedCampus])

  const updateStatus = (index, status) => {
    const updated = [...records]
    updated[index].status = status
    setRecords(updated)
  }

  const saveAttendance = () => {
    setSaving(true)
    setMessage('')
    const recordPayload = records.map(r => ({ student_id: r.id, status: r.status }))
    api().post('/attendance', { records: recordPayload, date }).then(res => {
      setMessage('Attendance saved successfully!')
      setSaving(false)
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => {
      setMessage('Error: ' + (err.response?.data?.message || 'Failed'))
      setSaving(false)
    })
  }

  const presentCount = records.filter(r => r.status === 'present').length
  const lateCount = records.filter(r => r.status === 'late').length
  const absentCount = records.filter(r => r.status === 'absent').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Attendance</h1>
        <input type="date" className="input-field w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold">{records.length}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="card text-center bg-green-50">
          <p className="text-3xl font-bold text-green-600">{presentCount}</p>
          <p className="text-sm text-green-600">Present</p>
        </div>
        <div className="card text-center bg-amber-50">
          <p className="text-3xl font-bold text-amber-600">{lateCount}</p>
          <p className="text-sm text-amber-600">Late</p>
        </div>
        <div className="card text-center bg-red-50">
          <p className="text-3xl font-bold text-red-600">{absentCount}</p>
          <p className="text-sm text-red-600">Absent</p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Student ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3 text-center">Mark Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">No students found</td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{r.student_code || r.student_id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{r.first_name} {r.last_name}</p>
                    <p className="text-xs text-gray-500">{r.father_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{r.class_name} - {r.section_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => updateStatus(i, 'present')}
                        className={`p-2 rounded-lg transition-colors ${r.status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100'}`}
                        title="Present"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(i, 'late')}
                        className={`p-2 rounded-lg transition-colors ${r.status === 'late' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-amber-100'}`}
                        title="Late"
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(i, 'absent')}
                        className={`p-2 rounded-lg transition-colors ${r.status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-red-100'}`}
                        title="Absent"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => updateStatus(i, 'excused')}
                        className={`p-2 rounded-lg transition-colors ${r.status === 'excused' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-blue-100'}`}
                        title="Excused"
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {records.length > 0 && (
        <div className="flex justify-end">
          <button onClick={saveAttendance} disabled={saving} className="btn-success px-8 py-3 text-lg">
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      )}
    </div>
  )
}

function CommissionsTab() {
  const [commissions, setCommissions] = useState([])
  const [summary, setSummary] = useState({})
  const [campusSummary, setCampusSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', campus_id: '' })
  const [message, setMessage] = useState('')

  const loadCommissions = () => {
    setLoading(true)
    const params = {}
    if (filter.status) params.status = filter.status
    if (filter.campus_id) params.campus_id = filter.campus_id
    api().get('/commissions', { params }).then(res => {
      setCommissions(res.data.data)
      setSummary(res.data.summary)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const loadSummary = () => {
    api().get('/commissions/summary').then(res => {
      setCampusSummary(res.data.data.byCampus || [])
    }).catch(() => {})
  }

  useEffect(() => { loadCommissions(); loadSummary() }, [filter])

  const markPaid = (id) => {
    api().put(`/commissions/${id}/pay`).then(() => {
      setMessage('Commission marked as paid!')
      loadCommissions(); loadSummary()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const markAllPaid = () => {
    if (!confirm('Mark ALL pending commissions as paid?')) return
    api().put('/commissions/pay-all').then(res => {
      setMessage(res.data.message)
      loadCommissions(); loadSummary()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  return (
    <div className="space-y-4">
      {message && <div className="px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700">{message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold">{formatCurrency(summary.total_amount || 0)}</p>
          <p className="text-sm text-gray-500">Total Commission (15%)</p>
        </div>
        <div className="card text-center bg-green-50">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid_amount || 0)}</p>
          <p className="text-sm text-green-600">Paid ({summary.paid || 0})</p>
        </div>
        <div className="card text-center bg-amber-50">
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.pending_amount || 0)}</p>
          <p className="text-sm text-amber-600">Pending ({summary.pending || 0})</p>
        </div>
        <div className="card text-center bg-blue-50">
          <p className="text-2xl font-bold text-blue-600">{summary.total || 0}</p>
          <p className="text-sm text-blue-600">Total Students</p>
        </div>
      </div>

      {campusSummary.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-sm mb-3">By Campus</h3>
          <div className="grid grid-cols-2 gap-3">
            {campusSummary.map(c => (
              <div key={c.campus_id} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium">{c.campus_name}</p>
                <p className="text-xs text-gray-500">{c.total_students} students &middot; {formatCurrency(c.total_commission)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <select className="input-field w-auto text-sm" value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <select className="input-field w-auto text-sm" value={filter.campus_id} onChange={e => setFilter({...filter, campus_id: e.target.value})}>
          <option value="">All Campuses</option>
          <option value="1">Khanpur Road</option>
          <option value="2">UET Campus</option>
        </select>
        {summary.pending > 0 && (
          <button onClick={markAllPaid} className="btn-success text-sm">Mark All Paid</button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3 text-right">Admission Fee</th>
                <th className="px-4 py-3 text-center">Rate</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : commissions.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No commissions</td></tr>
              ) : commissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{c.student_name}</p>
                    <p className="text-xs text-gray-500">{c.student_code}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{c.class_name}</td>
                  <td className="px-4 py-3 text-xs"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{c.campus_name}</span></td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(c.admission_fee)}</td>
                  <td className="px-4 py-3 text-sm text-center">{c.commission_rate}%</td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-600">{formatCurrency(c.commission_amount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.status === 'pending' && (
                      <button onClick={() => markPaid(c.id)} className="btn-success text-xs py-1 px-3">Pay</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FinancePage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('vouchers')
  const [vouchers, setVouchers] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const { selectedCampus } = useCampus()
  const [structures, setStructures] = useState([])
  const [classes, setClasses] = useState([])
  const [showStructForm, setShowStructForm] = useState(false)
  const [editStruct, setEditStruct] = useState(null)
  const [structForm, setStructForm] = useState({ class_id: '', name: '', tuition_fee: '', exam_fee: '', transport_fee: '', lab_fee: '', activity_fee: '' })
  const [message, setMessage] = useState('')

  const loadVouchers = () => {
    setLoading(true)
    const params = {}
    if (selectedCampus) params.campus_id = selectedCampus
    api().get('/fees/vouchers', { params }).then(res => {
      setVouchers(res.data.data)
      setSummary(res.data.summary)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const loadStructures = () => {
    setLoading(true)
    const params = {}
    if (selectedCampus) params.campus_id = selectedCampus
    api().get('/fees/structures', { params }).then(res => {
      setStructures(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    if (activeTab === 'vouchers') loadVouchers()
    if (activeTab === 'structures') { loadStructures(); api().get('/classes').then(r => setClasses(r.data.data)) }
  }, [activeTab, selectedCampus])

  const recordPayment = () => {
    if (!showPaymentModal || !paymentAmount) return
    api().post('/fees/payments', {
      voucher_id: showPaymentModal.id,
      amount: parseFloat(paymentAmount),
      payment_method: paymentMethod
    }).then(res => {
      setShowPaymentModal(null)
      setPaymentAmount('')
      loadVouchers()
    }).catch(err => alert(err.response?.data?.message || 'Payment failed'))
  }

  const saveStruct = (e) => {
    e.preventDefault()
    const data = { ...structForm, class_id: parseInt(structForm.class_id), tuition_fee: parseFloat(structForm.tuition_fee) || 0, exam_fee: parseFloat(structForm.exam_fee) || 0, transport_fee: parseFloat(structForm.transport_fee) || 0, lab_fee: parseFloat(structForm.lab_fee) || 0, activity_fee: parseFloat(structForm.activity_fee) || 0 }
    const method = editStruct ? 'put' : 'post'
    const url = editStruct ? `/fees/structures/${editStruct.id}` : '/fees/structures'
    api()[method](url, data).then(() => {
      setMessage(editStruct ? 'Fee structure updated!' : 'Fee structure created!')
      setShowStructForm(false)
      setEditStruct(null)
      setStructForm({ class_id: '', name: '', tuition_fee: '', exam_fee: '', transport_fee: '', lab_fee: '', activity_fee: '' })
      loadStructures()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const deleteStruct = (id) => {
    if (!confirm('Delete this fee structure?')) return
    api().delete(`/fees/structures/${id}`).then(() => {
      setMessage('Fee structure deleted!')
      loadStructures()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const startEditStruct = (s) => {
    setEditStruct(s)
    setStructForm({ class_id: s.class_id, name: s.name, tuition_fee: s.tuition_fee, exam_fee: s.exam_fee, transport_fee: s.transport_fee, lab_fee: s.lab_fee, activity_fee: s.activity_fee })
    setShowStructForm(true)
  }

  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
  }

  const canEditFinance = ['super_admin', 'campus_admin', 'accountant'].includes(user?.role)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Finance Management</h1>

      <div className="flex gap-2 border-b">
        {['vouchers', 'structures', 'commissions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'vouchers' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card text-center">
              <p className="text-2xl font-bold">{formatCurrency(summary.total_amount || 0)}</p>
              <p className="text-sm text-gray-500">Total Billed</p>
            </div>
            <div className="card text-center bg-green-50">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid_amount || 0)}</p>
              <p className="text-sm text-green-600">Collected ({summary.paid_count || 0})</p>
            </div>
            <div className="card text-center bg-red-50">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.pending_amount || 0)}</p>
              <p className="text-sm text-red-600">Pending ({summary.pending_count || 0})</p>
            </div>
            <div className="card text-center bg-blue-50">
              <p className="text-2xl font-bold text-blue-600">
                {summary.total_amount > 0 ? ((summary.paid_amount || 0) / summary.total_amount * 100).toFixed(0) : 0}%
              </p>
              <p className="text-sm text-blue-600">Collection Rate</p>
            </div>
          </div>

          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">Voucher #</th>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Month/Year</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : vouchers.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No vouchers</td></tr>
                  ) : vouchers.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{v.voucher_number}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{v.first_name} {v.last_name}</p>
                        <p className="text-xs text-gray-500">{v.student_code}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{v.class_name}</td>
                      <td className="px-4 py-3 text-sm">{monthNames[v.month]} {v.year}</td>
                      <td className="px-4 py-3 text-sm font-bold text-right">{formatCurrency(v.total_amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[v.status]}`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {v.status !== 'paid' && (
                            <button
                              onClick={() => { setShowPaymentModal(v); setPaymentAmount(String(v.total_amount)); }}
                              className="btn-success text-xs py-1 px-3"
                            >
                              Pay Now
                            </button>
                          )}
                          {v.last_payment_id && (
                            <button
                              onClick={() => {
                                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                                const token = localStorage.getItem('token');
                                window.open(`${baseURL}/fees/receipt/${v.last_payment_id}?token=${token}`, '_blank');
                              }}
                              className="text-xs py-1 px-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                            >
                              Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'structures' && (
        <div className="space-y-4">
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('deleted') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
          )}
          {canEditFinance && (
            <div className="flex justify-end">
              <button onClick={() => { setEditStruct(null); setStructForm({ class_id: '', name: '', tuition_fee: '', exam_fee: '', transport_fee: '', lab_fee: '', activity_fee: '' }); setShowStructForm(!showStructForm) }} className="btn-primary">
                <Plus className="w-4 h-4 mr-1 inline" /> Add Fee Structure
              </button>
            </div>
          )}
          {showStructForm && (
            <div className="card">
              <h3 className="font-bold mb-3">{editStruct ? 'Edit Fee Structure' : 'New Fee Structure'}</h3>
              <form onSubmit={saveStruct} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Class *</label>
                    <select className="input-field" value={structForm.class_id} onChange={e => setStructForm({...structForm, class_id: e.target.value})} required>
                      <option value="">Select Class</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.campus_name})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Structure Name *</label>
                    <input className="input-field" value={structForm.name} onChange={e => setStructForm({...structForm, name: e.target.value})} required placeholder="e.g. Monthly Fee 2026" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="label">Tuition Fee (PKR)</label>
                    <input type="number" className="input-field" value={structForm.tuition_fee} onChange={e => setStructForm({...structForm, tuition_fee: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Exam Fee (PKR)</label>
                    <input type="number" className="input-field" value={structForm.exam_fee} onChange={e => setStructForm({...structForm, exam_fee: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Transport Fee (PKR)</label>
                    <input type="number" className="input-field" value={structForm.transport_fee} onChange={e => setStructForm({...structForm, transport_fee: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Lab Fee (PKR)</label>
                    <input type="number" className="input-field" value={structForm.lab_fee} onChange={e => setStructForm({...structForm, lab_fee: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Activity Fee (PKR)</label>
                    <input type="number" className="input-field" value={structForm.activity_fee} onChange={e => setStructForm({...structForm, activity_fee: e.target.value})} min="0" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowStructForm(false); setEditStruct(null) }} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">{editStruct ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          )}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Campus</th>
                    <th className="px-4 py-3 text-right">Tuition</th>
                    <th className="px-4 py-3 text-right">Exam</th>
                    <th className="px-4 py-3 text-right">Transport</th>
                    <th className="px-4 py-3 text-right">Lab</th>
                    <th className="px-4 py-3 text-right">Activity</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    {canEditFinance && <th className="px-4 py-3 text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={canEditFinance ? 9 : 8} className="text-center py-10 text-gray-500">Loading...</td></tr>
                  ) : structures.length === 0 ? (
                    <tr><td colSpan={canEditFinance ? 9 : 8} className="text-center py-10 text-gray-500">No fee structures</td></tr>
                  ) : structures.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium">{s.class_name}</td>
                      <td className="px-4 py-3 text-sm">{s.campus_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.tuition_fee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.exam_fee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.transport_fee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.lab_fee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.activity_fee)}</td>
                      <td className="px-4 py-3 text-sm text-right font-bold">{formatCurrency((s.tuition_fee || 0) + (s.exam_fee || 0) + (s.transport_fee || 0) + (s.lab_fee || 0) + (s.activity_fee || 0))}</td>
                      {canEditFinance && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => startEditStruct(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => deleteStruct(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'commissions' && user?.role === 'super_admin' && <CommissionsTab />}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Record Payment</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Voucher: {showPaymentModal.voucher_number}</p>
                <p className="text-sm text-gray-500">Student: {showPaymentModal.first_name} {showPaymentModal.last_name}</p>
                <p className="text-lg font-bold mt-1">Total: {formatCurrency(showPaymentModal.total_amount)}</p>
              </div>
              <div>
                <label className="label">Payment Amount (PKR)</label>
                <input type="number" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select className="input-field" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowPaymentModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={recordPayment} className="btn-success flex-1">Record Payment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editAnnouncement, setEditAnnouncement] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', type: 'general' })

  useEffect(() => {
    api().get('/announcements').then(res => {
      setAnnouncements(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleCreate = (e) => {
    e.preventDefault()
    api().post('/announcements', form).then(res => {
      setAnnouncements([res.data.data, ...announcements])
      setShowForm(false)
      setForm({ title: '', content: '', type: 'general' })
    }).catch(err => alert(err.response?.data?.message || 'Failed'))
  }

  const handleUpdate = (e) => {
    e.preventDefault()
    api().put(`/announcements/${editAnnouncement.id}`, form).then(res => {
      setAnnouncements(announcements.map(a => a.id === editAnnouncement.id ? res.data.data : a))
      setEditAnnouncement(null)
      setShowForm(false)
      setForm({ title: '', content: '', type: 'general' })
    }).catch(err => alert(err.response?.data?.message || 'Failed'))
  }

  const startEdit = (a) => {
    setEditAnnouncement(a)
    setForm({ title: a.title, content: a.content, type: a.type || 'general' })
    setShowForm(true)
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this announcement?')) return
    api().delete(`/announcements/${id}`).then(() => {
      setAnnouncements(announcements.filter(a => a.id !== id))
    }).catch(err => alert(err.response?.data?.message || 'Failed'))
  }

  const openCreate = () => {
    setEditAnnouncement(null)
    setForm({ title: '', content: '', type: 'general' })
    setShowForm(!showForm)
  }

  const typeColors = {
    general: 'bg-blue-100 text-blue-700',
    urgent: 'bg-red-100 text-red-700',
    event: 'bg-green-100 text-green-700',
    holiday: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Announcements</h1>
        {['super_admin', 'campus_admin', 'teacher'].includes(user?.role) && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-1 inline" /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={editAnnouncement ? handleUpdate : handleCreate} className="space-y-3">
            <div>
              <label className="label">Title</label>
              <input className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
            </div>
            <div>
              <label className="label">Content</label>
              <textarea className="input-field" rows={3} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditAnnouncement(null); setForm({ title: '', content: '', type: 'general' }) }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editAnnouncement ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${typeColors[a.type]}`}>
                      {a.type?.toUpperCase()}
                    </span>
                    {a.campus_name && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{a.campus_name}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{a.title}</h3>
                  <p className="text-gray-600 mt-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-3">By {a.created_by_name} &middot; {formatDate(a.created_at)}</p>
                </div>
                {['super_admin', 'campus_admin', 'teacher'].includes(user?.role) && (
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => startEdit(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const monthNamesShort = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function TeachersPage() {
  const { user } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editTeacher, setEditTeacher] = useState(null)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', campus_id: '', base_salary: '' })
  const [salaryModal, setSalaryModal] = useState(null)
  const [salaryRecords, setSalaryRecords] = useState([])
  const [salaryForm, setSalaryForm] = useState({ month: '', year: '2026', base_salary: '', bonus: '', deductions: '', notes: '' })
  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [editSalary, setEditSalary] = useState(null)

  const loadTeachers = () => {
    api().get('/teachers').then(res => {
      setTeachers(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadTeachers() }, [])

  const handleAdd = (e) => {
    e.preventDefault()
    const data = { ...form, base_salary: parseFloat(form.base_salary) || 0 }
    if (!data.campus_id) data.campus_id = user?.campus_id || 1
    api().post('/teachers', data).then(() => {
      setMessage('Teacher added!')
      setShowForm(false)
      setForm({ name: '', email: '', phone: '', password: '', campus_id: '', base_salary: '' })
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const handleEditTeacher = (e) => {
    e.preventDefault()
    const data = { name: form.name, email: form.email, phone: form.phone }
    if (form.campus_id) data.campus_id = form.campus_id
    api().put(`/teachers/${editTeacher.id}`, data).then(() => {
      setMessage('Teacher updated!')
      setShowForm(false)
      setEditTeacher(null)
      setForm({ name: '', email: '', phone: '', password: '', campus_id: '', base_salary: '' })
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const startEditTeacher = (t) => {
    setEditTeacher(t)
    setForm({ name: t.name, email: t.email, phone: t.phone || '', password: '', campus_id: t.campus_id || '', base_salary: '' })
    setShowForm(true)
  }

  const handleDelete = (teacher) => {
    if (!confirm(`Remove "${teacher.name}"?`)) return
    api().delete(`/teachers/${teacher.id}`).then(() => {
      setMessage('Teacher removed!')
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const openSalaryModal = (teacher) => {
    setSalaryModal(teacher)
    setShowSalaryForm(false)
    api().get(`/teachers/${teacher.id}/salaries`).then(res => {
      setSalaryRecords(res.data.data)
    }).catch(() => setSalaryRecords([]))
  }

  const addSalary = (e) => {
    e.preventDefault()
    const data = {
      ...salaryForm,
      base_salary: parseFloat(salaryForm.base_salary) || 0,
      bonus: parseFloat(salaryForm.bonus) || 0,
      deductions: parseFloat(salaryForm.deductions) || 0
    }
    api().post(`/teachers/${salaryModal.id}/salaries`, data).then(() => {
      setMessage('Salary record added!')
      setShowSalaryForm(false)
      setSalaryForm({ month: '', year: '2026', base_salary: '', bonus: '', deductions: '', notes: '' })
      api().get(`/teachers/${salaryModal.id}/salaries`).then(res => setSalaryRecords(res.data.data))
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const markPaid = (salaryId) => {
    api().put(`/teachers/${salaryModal.id}/salaries/${salaryId}/pay`).then(() => {
      setMessage('Salary marked as paid!')
      api().get(`/teachers/${salaryModal.id}/salaries`).then(res => setSalaryRecords(res.data.data))
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const updateSalary = (e) => {
    e.preventDefault()
    const data = {
      ...salaryForm,
      base_salary: parseFloat(salaryForm.base_salary) || 0,
      bonus: parseFloat(salaryForm.bonus) || 0,
      deductions: parseFloat(salaryForm.deductions) || 0
    }
    api().put(`/teachers/${salaryModal.id}/salaries/${editSalary.id}`, data).then(() => {
      setMessage('Salary updated!')
      setEditSalary(null)
      setShowSalaryForm(false)
      setSalaryForm({ month: '', year: '2026', base_salary: '', bonus: '', deductions: '', notes: '' })
      api().get(`/teachers/${salaryModal.id}/salaries`).then(res => setSalaryRecords(res.data.data))
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const deleteSalary = (salaryId) => {
    if (!confirm('Delete this salary record?')) return
    api().delete(`/teachers/${salaryModal.id}/salaries/${salaryId}`).then(() => {
      setMessage('Salary record deleted!')
      api().get(`/teachers/${salaryModal.id}/salaries`).then(res => setSalaryRecords(res.data.data))
      loadTeachers()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const startEditSalary = (s) => {
    setEditSalary(s)
    setShowSalaryForm(false)
    setSalaryForm({ month: String(s.month), year: String(s.year), base_salary: String(s.base_salary), bonus: String(s.bonus), deductions: String(s.deductions), notes: s.notes || '' })
  }

  const totalPaid = salaryRecords.filter(s => s.status === 'paid').reduce((sum, s) => sum + s.net_salary, 0)
  const totalPending = salaryRecords.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.net_salary, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teachers Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{teachers.length} teachers</span>
          {['super_admin', 'campus_admin'].includes(user?.role) && (
            <button onClick={() => { setEditTeacher(null); setForm({ name: '', email: '', phone: '', password: '', campus_id: '', base_salary: '' }); setShowForm(!showForm) }} className="btn-primary">
              <UserPlus className="w-4 h-4 mr-1 inline" /> Add Teacher
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${message.includes('removed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
      )}

      {showForm && (
        <div className="card">
          <h3 className="font-bold mb-3">{editTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h3>
          <form onSubmit={editTeacher ? handleEditTeacher : handleAdd} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input-field" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              {!editTeacher && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" className="input-field" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
                </div>
              )}
              {user?.role === 'super_admin' && (
                <div>
                  <label className="label">Campus</label>
                  <select className="input-field" value={form.campus_id} onChange={e => setForm({...form, campus_id: e.target.value})}>
                    <option value="">Select Campus</option>
                    <option value="1">Khanpur Road</option>
                    <option value="2">UET Campus</option>
                  </select>
                </div>
              )}
              {!editTeacher && (
                <div>
                  <label className="label">Monthly Salary (PKR)</label>
                  <input type="number" className="input-field" value={form.base_salary} onChange={e => setForm({...form, base_salary: e.target.value})} min="0" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowForm(false); setEditTeacher(null); setForm({ name: '', email: '', phone: '', password: '', campus_id: '', base_salary: '' }) }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editTeacher ? 'Update Teacher' : 'Add Teacher'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Campus</th>
                <th className="px-4 py-3 text-center">Sections</th>
                <th className="px-4 py-3 text-right">Last Salary</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : teachers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No teachers found</td></tr>
              ) : teachers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-xs font-bold">{t.name?.charAt(0)}</div>
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.phone || '-'}</td>
                  <td className="px-4 py-3 text-xs"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{t.campus_name?.split(' - ')[1]}</span></td>
                  <td className="px-4 py-3 text-sm text-center">{t.sections_assigned}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{t.last_salary ? formatCurrency(t.last_salary) : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openSalaryModal(t)} className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg" title="Salary">Salary</button>
                      {['super_admin', 'campus_admin'].includes(user?.role) && (
                        <>
                          <button onClick={() => startEditTeacher(t)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(t)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Remove">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {salaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Salary - {salaryModal.name}</h3>
              <button onClick={() => setSalaryModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-green-600">Total Paid</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{salaryRecords.length}</p>
                <p className="text-xs text-blue-600">Records</p>
              </div>
            </div>

            {['super_admin', 'campus_admin'].includes(user?.role) && (
              <button onClick={() => { setShowSalaryForm(!showSalaryForm); setEditSalary(null); setSalaryForm({ month: '', year: '2026', base_salary: '', bonus: '', deductions: '', notes: '' }) }} className="btn-primary w-full mb-4 text-sm">
                <Plus className="w-4 h-4 mr-1 inline" /> {editSalary ? 'Edit Salary' : 'Add Salary Record'}
              </button>
            )}

            {(showSalaryForm || editSalary) && (
              <form onSubmit={editSalary ? updateSalary : addSalary} className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">{editSalary ? 'Edit Salary Record' : 'New Salary Record'}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Month *</label>
                    <select className="input-field" value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: e.target.value})} required>
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Year *</label>
                    <input type="number" className="input-field" value={salaryForm.year} onChange={e => setSalaryForm({...salaryForm, year: e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Base Salary *</label>
                    <input type="number" className="input-field" value={salaryForm.base_salary} onChange={e => setSalaryForm({...salaryForm, base_salary: e.target.value})} min="0" required />
                  </div>
                  <div>
                    <label className="label">Bonus</label>
                    <input type="number" className="input-field" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Deductions</label>
                    <input type="number" className="input-field" value={salaryForm.deductions} onChange={e => setSalaryForm({...salaryForm, deductions: e.target.value})} min="0" />
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <input className="input-field" value={salaryForm.notes} onChange={e => setSalaryForm({...salaryForm, notes: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setShowSalaryForm(false); setEditSalary(null); setSalaryForm({ month: '', year: '2026', base_salary: '', bonus: '', deductions: '', notes: '' }) }} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1">{editSalary ? 'Update' : 'Save'}</button>
                </div>
              </form>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {salaryRecords.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">No salary records</p>
              ) : salaryRecords.map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{monthNames[s.month]} {s.year}</p>
                    <p className="text-xs text-gray-500">
                      Base: {formatCurrency(s.base_salary)}
                      {s.bonus > 0 && ` + Bonus: ${formatCurrency(s.bonus)}`}
                      {s.deductions > 0 && ` - Deductions: ${formatCurrency(s.deductions)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(s.net_salary)}</p>
                      {s.status === 'paid' ? (
                        <span className="text-xs text-green-600">Paid {formatDate(s.paid_date)}</span>
                      ) : (
                        <button onClick={() => markPaid(s.id)} className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded mt-1">Mark Paid</button>
                      )}
                    </div>
                    {['super_admin', 'campus_admin'].includes(user?.role) && (
                      <div className="flex flex-col gap-1">
                        <button onClick={() => startEditSalary(s)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => deleteSalary(s.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t">
              <button onClick={() => setSalaryModal(null)} className="btn-secondary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ExamsPage() {
  const { user } = useAuth()
  const { selectedCampus } = useCampus()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [form, setForm] = useState({ name: '', type: 'midterm', class_id: '', campus_id: '', total_marks: '100', passing_marks: '40', start_date: '', end_date: '' })
  const [marksView, setMarksView] = useState(null)
  const [marksData, setMarksData] = useState([])
  const [reportView, setReportView] = useState(null)
  const [reportData, setReportData] = useState(null)

  const loadExams = () => {
    setLoading(true)
    const params = {}
    if (selectedCampus) params.campus_id = selectedCampus
    api().get('/exams', { params }).then(res => { setExams(res.data.data); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => {
    loadExams()
    api().get('/classes').then(r => setClasses(r.data.data))
    api().get('/classes/teachers').then(r => {}).catch(() => {})
  }, [selectedCampus])

  const loadSubjects = (classId) => {
    api().get('/classes/' + classId + '/sections').then(r => {}).catch(() => {})
    api().get('/exams/0/subjects').catch(() => {})
  }

  const handleCreate = (e) => {
    e.preventDefault()
    const data = { ...form, class_id: parseInt(form.class_id), campus_id: form.campus_id ? parseInt(form.campus_id) : undefined, total_marks: parseInt(form.total_marks), passing_marks: parseInt(form.passing_marks), subject_ids: selectedSubjects.map(s => ({ id: s.id, max_marks: parseInt(form.total_marks), passing_marks: parseInt(form.passing_marks) })) }
    api().post('/exams', data).then(() => {
      setMessage('Exam created!'); setShowForm(false); loadExams()
      setForm({ name: '', type: 'midterm', class_id: '', campus_id: '', total_marks: '100', passing_marks: '40', start_date: '', end_date: '' }); setSelectedSubjects([])
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const openMarksEntry = (exam) => {
    setMarksView(exam)
    api().get(`/exams/${exam.id}/students`).then(res => {
      const { students, subjects: subs, existingMarks } = res.data.data
      const initial = []
      students.forEach(s => {
        subs.forEach(sub => {
          const existing = existingMarks.find(m => m.student_id === s.id && m.subject_id === sub.subject_id)
          initial.push({ student_id: s.id, student_name: `${s.first_name} ${s.last_name}`, student_code: s.student_code, subject_id: sub.subject_id, subject_name: sub.subject_name, max_marks: sub.max_marks, marks_obtained: existing ? existing.marks_obtained : '', remarks: existing ? existing.remarks : '' })
        })
      })
      setMarksData(initial)
    }).catch(err => alert('Error loading data'))
  }

  const updateMark = (idx, field, value) => {
    const updated = [...marksData]
    updated[idx] = { ...updated[idx], [field]: value }
    setMarksData(updated)
  }

  const saveMarks = () => {
    const marks = marksData.filter(m => m.marks_obtained !== '').map(m => ({ student_id: m.student_id, subject_id: m.subject_id, marks_obtained: parseFloat(m.marks_obtained) || 0, remarks: m.remarks }))
    api().post(`/exams/${marksView.id}/marks`, { marks }).then(() => {
      setMessage('Marks saved!'); setMarksView(null); loadExams()
      setTimeout(() => setMessage(''), 3000)
    }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const openReport = (exam) => {
    setReportView(exam)
    api().get(`/exams/${exam.id}/report`).then(res => {
      setReportData(res.data.data)
    }).catch(err => alert('Error loading report'))
  }

  const deleteExam = (id) => {
    if (!confirm('Delete this exam?')) return
    api().delete(`/exams/${id}`).then(() => { setMessage('Exam deleted!'); loadExams(); setTimeout(() => setMessage(''), 3000) }).catch(err => alert(err.response?.data?.message || 'Error'))
  }

  const toggleSubject = (sub) => {
    setSelectedSubjects(prev => prev.find(s => s.id === sub.id) ? prev.filter(s => s.id !== sub.id) : [...prev, sub])
  }

  const filteredClasses = selectedCampus ? classes.filter(c => c.campus_id === selectedCampus) : classes

  const statusColors = { upcoming: 'bg-blue-100 text-blue-700', ongoing: 'bg-amber-100 text-amber-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }

  if (marksView) {
    const students = [...new Set(marksData.map(m => ({ id: m.student_id, name: m.student_name, code: m.student_code })))].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
    const subjectsList = [...new Set(marksData.map(m => ({ id: m.subject_id, name: m.subject_name, max: m.max_marks })))]
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => setMarksView(null)} className="text-blue-600 hover:text-blue-800 text-sm mb-1">&larr; Back to Exams</button>
            <h1 className="text-2xl font-bold">Marks Entry: {marksView.name}</h1>
            <p className="text-sm text-gray-500">{marksView.class_name} &middot; {students.length} students &middot; {subjectsList.length} subjects</p>
          </div>
          <button onClick={saveMarks} className="btn-primary">Save All Marks</button>
        </div>
        {message && <div className="px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700">{message}</div>}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2">Student</th>
                  {subjectsList.map(s => <th key={s.id} className="px-3 py-2 text-center">{s.name} ({s.max})</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><p className="font-medium">{student.name}</p><p className="text-xs text-gray-500">{student.code}</p></td>
                    {subjectsList.map((sub, si) => {
                      const idx = marksData.findIndex(m => m.student_id === student.id && m.subject_id === sub.id)
                      return (
                        <td key={sub.id} className="px-3 py-2 text-center">
                          <input type="number" className="input-field w-20 text-center text-sm py-1" value={marksData[idx]?.marks_obtained || ''} onChange={e => updateMark(idx, 'marks_obtained', e.target.value)} min="0" max={sub.max} placeholder="0" />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  if (reportView && reportData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <button onClick={() => { setReportView(null); setReportData(null) }} className="text-blue-600 hover:text-blue-800 text-sm mb-1">&larr; Back to Exams</button>
            <h1 className="text-2xl font-bold">Report Card: {reportData.exam.name}</h1>
            <p className="text-sm text-gray-500">{reportData.exam.class_name} &middot; {reportData.exam.campus_name}</p>
          </div>
          <button onClick={() => window.print()} className="btn-primary">Print Report</button>
        </div>
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Student</th>
                  {reportData.subjects.map(s => <th key={s.subject_id} className="px-3 py-2 text-center">{s.subject_name}</th>)}
                  <th className="px-3 py-2 text-center">Total</th>
                  <th className="px-3 py-2 text-center">%</th>
                  <th className="px-3 py-2 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.reportData.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-bold">{r.position}</td>
                    <td className="px-3 py-2"><p className="font-medium">{r.first_name} {r.last_name}</p><p className="text-xs text-gray-500">{r.student_code}</p></td>
                    {r.subjects.map((s, i) => <td key={i} className="px-3 py-2 text-center">{s.marks_obtained}/{s.max_marks}</td>)}
                    <td className="px-3 py-2 text-center font-bold">{r.totalObtained}/{r.totalMax}</td>
                    <td className="px-3 py-2 text-center font-bold">{r.percentage}%</td>
                    <td className="px-3 py-2 text-center"><span className={`px-2 py-1 text-xs font-bold rounded-full ${r.overallGrade === 'A+' || r.overallGrade === 'A' ? 'bg-green-100 text-green-700' : r.overallGrade === 'F' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{r.overallGrade}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exams & Results</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{exams.length} exams</span>
          {['super_admin', 'campus_admin', 'teacher'].includes(user?.role) && (
            <button onClick={() => { setShowForm(!showForm); setForm({ name: '', type: 'midterm', class_id: '', campus_id: '', total_marks: '100', passing_marks: '40', start_date: '', end_date: '' }); setSelectedSubjects([]) }} className="btn-primary">
              <Plus className="w-4 h-4 mr-1 inline" /> New Exam
            </button>
          )}
        </div>
      </div>
      {message && <div className="px-4 py-3 rounded-lg text-sm bg-green-50 text-green-700">{message}</div>}

      {showForm && (
        <div className="card">
          <h3 className="font-bold mb-3">Create New Exam</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Name *</label>
                <input className="input-field" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder="e.g. Midterm Exam 2026" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input-field" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Class *</label>
                <select className="input-field" value={form.class_id} onChange={e => setForm({...form, class_id: e.target.value})} required>
                  <option value="">Select Class</option>
                  {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {user?.role === 'super_admin' && (
                <div>
                  <label className="label">Campus</label>
                  <select className="input-field" value={form.campus_id} onChange={e => setForm({...form, campus_id: e.target.value})}>
                    <option value="">Select Campus</option><option value="1">Khanpur Road</option><option value="2">UET Campus</option>
                  </select>
                </div>
              )}
              <div>
                <label className="label">Total Marks</label>
                <input type="number" className="input-field" value={form.total_marks} onChange={e => setForm({...form, total_marks: e.target.value})} min="1" />
              </div>
              <div>
                <label className="label">Passing Marks</label>
                <input type="number" className="input-field" value={form.passing_marks} onChange={e => setForm({...form, passing_marks: e.target.value})} min="0" />
              </div>
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input-field" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input-field" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create Exam</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="table-header">
              <th className="px-4 py-3">Exam</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Campus</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Marks</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Students</th><th className="px-4 py-3 text-center">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Loading...</td></tr>
              ) : exams.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">No exams found</td></tr>
              ) : exams.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><p className="text-sm font-medium">{e.name}</p><p className="text-xs text-gray-500">{formatDate(e.start_date)}</p></td>
                  <td className="px-4 py-3 text-sm">{e.class_name}</td>
                  <td className="px-4 py-3 text-xs"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full">{e.campus_name?.split(' - ')[1]}</span></td>
                  <td className="px-4 py-3 text-sm capitalize">{e.type}</td>
                  <td className="px-4 py-3 text-sm">{e.total_marks}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[e.status]}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-sm text-center">{e.students_entered}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openMarksEntry(e)} className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg">Marks</button>
                      <button onClick={() => openReport(e)} className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg">Report</button>
                      {['super_admin', 'campus_admin'].includes(user?.role) && (
                        <button onClick={() => deleteExam(e.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('notifications')
  const [notifications, setNotifications] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    loadNotifications()
    loadActivityLogs()
  }, [])

  const loadNotifications = () => {
    api().get('/notifications').then(res => {
      setNotifications(res.data.data)
      setUnreadCount(res.data.unread_count)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  const loadActivityLogs = () => {
    api().get('/notifications/activity', { params: { limit: 50 } }).then(res => {
      setActivityLogs(res.data.data)
    }).catch(() => {})
  }

  const markAsRead = (id) => {
    api().put(`/notifications/${id}/read`).then(() => {
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  const markAllRead = () => {
    api().put('/notifications/read-all').then(() => {
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })))
      setUnreadCount(0)
    })
  }

  const actionColors = {
    created: 'bg-green-100 text-green-700',
    updated: 'bg-blue-100 text-blue-700',
    deleted: 'bg-red-100 text-red-700',
    'marked attendance': 'bg-purple-100 text-purple-700',
  }

  const roleColors = {
    super_admin: 'bg-yellow-100 text-yellow-700',
    campus_admin: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    accountant: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications & Activity</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'notifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Bell className="w-4 h-4" /> Notifications
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </button>
        <button onClick={() => setActiveTab('activity')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'activity' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Activity className="w-4 h-4" /> Activity Log
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <div className="flex justify-end">
              <button onClick={markAllRead} className="btn-secondary text-sm">
                <Check className="w-4 h-4 mr-1 inline" /> Mark all as read
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
          ) : notifications.length === 0 ? (
            <div className="card text-center py-10 text-gray-500">No notifications yet</div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`card flex items-start gap-4 cursor-pointer transition-colors ${!n.is_read ? 'bg-blue-50 border-blue-200' : ''}`} onClick={() => !n.is_read && markAsRead(n.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="table-header">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activityLogs.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-500">No activity logged yet</td></tr>
                ) : activityLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{log.user_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[log.user_role] || 'bg-gray-100 text-gray-700'}`}>
                        {log.user_role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{log.entity_type}: {log.entity_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ParentPortalPage() {
  const { user } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [attendance, setAttendance] = useState(null)
  const [fees, setFees] = useState([])
  const [results, setResults] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api().get('/parent/children').then(res => {
      setChildren(res.data)
      if (res.data.length > 0) setSelectedChild(res.data[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    if (activeTab === 'attendance') {
      const now = new Date()
      api().get(`/parent/attendance/${selectedChild.id}?month=${now.getMonth() + 1}&year=${now.getFullYear()}`)
        .then(res => setAttendance(res.data)).catch(() => {})
    } else if (activeTab === 'fees') {
      api().get(`/parent/fees/${selectedChild.id}`)
        .then(res => setFees(res.data)).catch(() => {})
    } else if (activeTab === 'results') {
      api().get(`/parent/results/${selectedChild.id}`)
        .then(res => setResults(res.data)).catch(() => {})
    } else if (activeTab === 'profile') {
      api().get('/parent/profile')
        .then(res => setProfile(res.data)).catch(() => {})
    }
  }, [selectedChild, activeTab])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  const tabs = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'attendance', label: 'Attendance', icon: ClipboardCheck },
    { key: 'fees', label: 'Fees', icon: DollarSign },
    { key: 'results', label: 'Results', icon: BarChart3 },
    { key: 'profile', label: 'Profile', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parent Portal</h1>
        {children.length > 1 && (
          <select
            value={selectedChild?.id || ''}
            onChange={e => setSelectedChild(children.find(c => c.id === parseInt(e.target.value)))}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.student_id})</option>
            ))}
          </select>
        )}
      </div>

      {selectedChild && (
        <>
          <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
              {selectedChild.first_name?.[0]}{selectedChild.last_name?.[0]}
            </div>
            <div>
              <p className="font-semibold">{selectedChild.first_name} {selectedChild.last_name}</p>
              <p className="text-sm text-gray-500">{selectedChild.class_name} - {selectedChild.section_name} | {selectedChild.campus_name}</p>
            </div>
          </div>

          <div className="flex gap-2 border-b pb-2 overflow-x-auto">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${activeTab === t.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <t.icon className="w-4 h-4" />{t.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                  <p className="text-sm text-gray-500">Status</p>
                </div>
                <p className="text-2xl font-bold text-green-600">Active</p>
                <p className="text-xs text-gray-400 mt-1">Admitted: {formatDate(selectedChild.admission_date)}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><GraduationCap className="w-5 h-5 text-blue-600" /></div>
                  <p className="text-sm text-gray-500">Class</p>
                </div>
                <p className="text-2xl font-bold">{selectedChild.class_name}</p>
                <p className="text-xs text-gray-400 mt-1">Section: {selectedChild.section_name}</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><School className="w-5 h-5 text-purple-600" /></div>
                  <p className="text-sm text-gray-500">Campus</p>
                </div>
                <p className="text-lg font-bold">{selectedChild.campus_name}</p>
                <p className="text-xs text-gray-400 mt-1">Student Code: {selectedChild.student_id}</p>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && attendance && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
                  <p className="text-2xl font-bold">{attendance.summary.total}</p>
                  <p className="text-xs text-gray-500">Total Days</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
                  <p className="text-2xl font-bold text-green-600">{attendance.summary.present}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
                  <p className="text-2xl font-bold text-red-600">{attendance.summary.absent}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
                  <p className="text-2xl font-bold text-yellow-600">{attendance.summary.late}</p>
                  <p className="text-xs text-gray-500">Late</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
                  <p className="text-2xl font-bold text-blue-600">{attendance.summary.percentage}%</p>
                  <p className="text-xs text-gray-500">Attendance</p>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Class</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {attendance.attendance.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{formatDate(a.date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            a.status === 'present' ? 'bg-green-100 text-green-700' :
                            a.status === 'absent' ? 'bg-red-100 text-red-700' :
                            a.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{a.class_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Paid</th>
                  <th className="px-4 py-3 text-left">Balance</th>
                  <th className="px-4 py-3 text-left">Due Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {fees.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No fee records</td></tr>
                  ) : fees.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{f.month} {f.year}</td>
                      <td className="px-4 py-3 text-gray-500">{f.class_name}</td>
                      <td className="px-4 py-3">{formatCurrency(f.amount)}</td>
                      <td className="px-4 py-3 text-green-600">{formatCurrency(f.total_paid)}</td>
                      <td className="px-4 py-3 text-red-600">{formatCurrency(f.balance)}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(f.due_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${f.balance <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {f.balance <= 0 ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="space-y-4">
              {results.length === 0 ? (
                <div className="bg-white rounded-xl p-10 shadow-sm border text-center text-gray-500">No exam results yet</div>
              ) : results.map(exam => (
                <div key={exam.exam_id} className="bg-white rounded-xl shadow-sm border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{exam.exam_name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.exam_type === 'final' ? 'bg-purple-100 text-purple-700' :
                        exam.exam_type === 'midterm' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{exam.exam_type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="font-bold">{exam.obtained_marks} / {exam.total_marks}</p>
                      <p className="text-xs text-gray-400">{((exam.obtained_marks / exam.total_marks) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {exam.subjects.map((sub, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">{sub.subject}</p>
                        <p className="font-semibold">{sub.marks}/{sub.total}</p>
                        <span className={`text-xs font-medium ${sub.grade === 'A+' || sub.grade === 'A' ? 'text-green-600' : sub.grade === 'F' ? 'text-red-600' : 'text-yellow-600'}`}>{sub.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && profile && (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-lg mb-4">Parent Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{profile.name}</p></div>
                <div><p className="text-xs text-gray-500">Email</p><p className="font-medium">{profile.email}</p></div>
                <div><p className="text-xs text-gray-500">Phone</p><p className="font-medium">{profile.phone_primary}</p></div>
                <div><p className="text-xs text-gray-500">CNIC</p><p className="font-medium">{profile.cnic || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Address</p><p className="font-medium">{profile.address || '-'}</p></div>
                <div><p className="text-xs text-gray-500">Occupation</p><p className="font-medium">{profile.occupation || '-'}</p></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" />
  return <Layout>{children}</Layout>
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedCampus, setSelectedCampus] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <CampusContext.Provider value={{ selectedCampus, setSelectedCampus }}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','teacher']}><StudentsPage /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','teacher']}><ClassesPage /></ProtectedRoute>} />
        <Route path="/teachers" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin']}><TeachersPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','teacher']}><AttendancePage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','accountant']}><FinancePage /></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','teacher']}><AnnouncementsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/exams" element={<ProtectedRoute allowedRoles={['super_admin','campus_admin','teacher']}><ExamsPage /></ProtectedRoute>} />
          <Route path="/parent" element={<ProtectedRoute allowedRoles={['parent']}><ParentPortalPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </CampusContext.Provider>
    </AuthContext.Provider>
  )
}

export default App
