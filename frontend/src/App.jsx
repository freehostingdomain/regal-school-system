import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, DollarSign,
  Bell, LogOut, Menu, X, ChevronDown, School, Bus, BookOpen,
  Calendar, Settings, BarChart3, FileText, Search, CheckCircle2,
  XCircle, Clock, AlertTriangle, TrendingUp, Eye, Plus, Activity,
  Check
} from 'lucide-react'

const AuthContext = createContext(null)

function useAuth() {
  return useContext(AuthContext)
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
      navigate('/dashboard')
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
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: GraduationCap, label: 'Classes', path: '/classes' },
    { icon: ClipboardCheck, label: 'Attendance', path: '/attendance' },
    { icon: DollarSign, label: 'Finance', path: '/finance' },
    { icon: Bell, label: 'Announcements', path: '/announcements' },
    { icon: Activity, label: 'Notifications', path: '/notifications' },
  ]

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
        {menuItems.map((item) => (
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
  const navigate = useNavigate()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api().get('/notifications').then(res => {
      setUnreadCount(res.data.unread_count)
    }).catch(() => {})
    const interval = setInterval(() => {
      api().get('/notifications').then(res => {
        setUnreadCount(res.data.unread_count)
      }).catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Welcome, {user?.name}</h2>
        <p className="text-sm text-gray-500">{user?.campus_name || 'All Campuses'}</p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/notifications')} className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
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

  useEffect(() => {
    api().get('/dashboard').then(res => {
      setData(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

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

  const loadStudents = (page = 1) => {
    api().get('/students', { params: { search, page, limit: 15 } }).then(res => {
      setStudents(res.data.data)
      setMeta(res.data.meta)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadStudents(); api().get('/classes').then(r => setClasses(r.data.data)) }, [])

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

function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api().get('/classes').then(res => {
      setClasses(res.data.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

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
        <span className="text-sm text-gray-500">{classes.length} classes</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(cls => (
            <div key={cls.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{cls.name}</h3>
                  <p className="text-sm text-gray-500">{cls.campus_name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelColors[cls.level] || 'bg-gray-100 text-gray-700'}`}>
                  {cls.level}
                </span>
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
            </div>
          ))}
        </div>
      )}
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

  const loadAttendance = () => {
    setLoading(true)
    api().get('/attendance/today').then(res => {
      setRecords(res.data.data.map(r => ({
        ...r,
        status: r.status || 'absent',
      })))
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { loadAttendance() }, [])

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

function FinancePage() {
  const [activeTab, setActiveTab] = useState('vouchers')
  const [vouchers, setVouchers] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  useEffect(() => {
    if (activeTab === 'vouchers') {
      api().get('/fees/vouchers').then(res => {
        setVouchers(res.data.data)
        setSummary(res.data.summary)
        setLoading(false)
      }).catch(() => setLoading(false))
    }
  }, [activeTab])

  const recordPayment = () => {
    if (!showPaymentModal || !paymentAmount) return
    api().post('/fees/payments', {
      voucher_id: showPaymentModal.id,
      amount: parseFloat(paymentAmount),
      payment_method: paymentMethod
    }).then(res => {
      setShowPaymentModal(null)
      setPaymentAmount('')
      api().get('/fees/vouchers').then(r => {
        setVouchers(r.data.data)
        setSummary(r.data.summary)
      })
    }).catch(err => alert(err.response?.data?.message || 'Payment failed'))
  }

  const statusColors = {
    paid: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Finance Management</h1>

      <div className="flex gap-2 border-b">
        {['vouchers', 'structures'].map(tab => (
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
                        {v.status !== 'paid' && (
                          <button
                            onClick={() => { setShowPaymentModal(v); setPaymentAmount(String(v.total_amount)); }}
                            className="btn-success text-xs py-1 px-3"
                          >
                            Pay Now
                          </button>
                        )}
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
        <div className="card">
          <p className="text-gray-500">Fee structure management coming soon. Currently using class-level fee configuration.</p>
        </div>
      )}

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
        {['super_admin', 'campus_admin', 'teacher', 'accountant'].includes(user?.role) && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus className="w-4 h-4 mr-1 inline" /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleCreate} className="space-y-3">
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
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Create</button>
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
              </div>
            </div>
          ))}
        </div>
      )}
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

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  return <Layout>{children}</Layout>
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
        <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
        <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><AnnouncementsPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthContext.Provider>
  )
}

export default App
