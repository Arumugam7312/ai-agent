import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Briefcase, 
  CheckSquare, 
  BookOpen, 
  Mail, 
  Settings, 
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Bell,
  User as UserIcon,
  Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import axios from 'axios';

axios.defaults.withCredentials = true;

// --- Components ---

const SidebarItem = ({ icon: Icon, label, to, active }: { icon: any, label: string, to: string, active: boolean }) => (
  <Link 
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: MessageSquare, label: 'AI Assistant', to: '/ai' },
    { icon: Briefcase, label: 'Projects', to: '/projects' },
    { icon: CheckSquare, label: 'Tasks', to: '/tasks' },
    { icon: BookOpen, label: 'Knowledge Base', to: '/knowledge' },
    { icon: LinkIcon, label: 'Integrations', to: '/integrations' },
    { icon: Mail, label: 'Email Tools', to: '/email' },
    { icon: Settings, label: 'Settings', to: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        className="bg-white border-r border-slate-200 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            S
          </div>
          <h1 className="text-xl font-bold tracking-tight">SmartDesk AI</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              {...item} 
              active={location.pathname === item.to} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                <UserIcon size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

// --- Pages ---

const Home = () => {
  const [stats, setStats] = useState({ projects: 0, tasks: 0, completed: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [p, t] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/tasks')
      ]);
      setStats({
        projects: p.data.length,
        tasks: t.data.filter((task: any) => task.status !== 'DONE').length,
        completed: t.data.filter((task: any) => task.status === 'DONE').length
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Welcome back!</h2>
        <p className="text-slate-500">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Projects', value: stats.projects, color: 'bg-blue-500' },
          { label: 'Pending Tasks', value: stats.tasks, color: 'bg-amber-500' },
          { label: 'Completed Tasks', value: stats.completed, color: 'bg-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-4xl font-bold">{stat.value}</h3>
              <div className={`w-12 h-1 ${stat.color} rounded-full`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <Plus size={16} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">New task created in "Marketing Campaign"</p>
                  <p className="text-xs text-slate-400">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold mb-4">Upcoming Deadlines</h3>
          <div className="space-y-4 text-center py-8">
            <CheckSquare size={48} className="mx-auto text-slate-200" />
            <p className="text-slate-500">No urgent deadlines for today. Good job!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AIChat = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('/api/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.text }]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Sorry, I encountered an error. Please check your connection or API key.';
      setMessages(prev => [...prev, { role: 'ai', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <MessageSquare size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">How can I help you today?</h3>
              <p className="text-slate-500 max-w-md">Try saying: "Create a task for the Website Redesign project to fix the footer by tomorrow"</p>
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-100 text-slate-900 rounded-tl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your command..."
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

const Projects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  const fetchProjects = async () => {
    const res = await axios.get('/api/projects');
    setProjects(res.data);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    await axios.post('/api/projects', newProject);
    setShowModal(false);
    setNewProject({ name: '', description: '' });
    fetchProjects();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Projects</h2>
          <p className="text-slate-500">Manage your team's initiatives.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Briefcase size={24} />
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded uppercase tracking-wider">
                {p.status}
              </span>
            </div>
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="text-slate-500 text-sm mt-1 line-clamp-2">{p.description}</p>
            <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400">{p.tasks?.length || 0} Tasks</span>
              <Link to={`/projects/${p.id}`} className="text-indigo-600 text-sm font-bold hover:underline">View Details</Link>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6">Create New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
                <input 
                  type="text" 
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', projectId: '', status: 'TODO' });

  const fetchData = async () => {
    const [t, p] = await Promise.all([
      axios.get('/api/tasks'),
      axios.get('/api/projects')
    ]);
    setTasks(t.data);
    setProjects(p.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    await axios.post('/api/tasks', newTask);
    setShowModal(false);
    setNewTask({ title: '', projectId: '', status: 'TODO' });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    await axios.patch(`/api/tasks/${id}`, { status });
    fetchData();
  };

  const columns = ['TODO', 'IN_PROGRESS', 'DONE'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tasks</h2>
          <p className="text-slate-500">Track and manage your daily work.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-16rem)]">
        {columns.map((col) => (
          <div key={col} className="bg-slate-100/50 rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                {col.replace('_', ' ')}
                <span className="bg-slate-200 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.status === col).length}
                </span>
              </h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {tasks.filter(t => t.status === col).map((task) => (
                <motion.div 
                  layoutId={task.id}
                  key={task.id} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <p className="text-xs text-indigo-600 font-bold mb-1 uppercase tracking-wider">{task.project?.name}</p>
                  <h4 className="font-semibold text-slate-900">{task.title}</h4>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
                    </div>
                    <select 
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className="text-xs bg-slate-50 border-none rounded p-1 outline-none"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6">Create New Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
                <select 
                  value={newTask.projectId}
                  onChange={(e) => setNewTask({...newTask, projectId: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const KnowledgeBase = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const { user } = useAuthStore();

  const fetchFaqs = async () => {
    const res = await axios.get(search ? `/api/faqs/search?q=${search}` : '/api/faqs');
    setFaqs(res.data);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchFaqs();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCreate = async () => {
    await axios.post('/api/faqs', newFaq);
    setShowModal(false);
    setNewFaq({ question: '', answer: '' });
    fetchFaqs();
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Knowledge Base</h2>
          <p className="text-slate-500">Manage FAQs and team documentation.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search knowledge..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 w-64 text-sm"
            />
          </div>
          {user?.role === 'ADMIN' && (
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={20} /> Add FAQ
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Q: {faq.question}</h3>
            <p className="text-slate-600">A: {faq.answer}</p>
          </div>
        ))}
        {faqs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
            <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">No FAQs found. Add some to build your knowledge base.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-6">Add New FAQ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Question</label>
                <input 
                  type="text" 
                  value={newFaq.question}
                  onChange={(e) => setNewFaq({...newFaq, question: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Answer</label>
                <textarea 
                  value={newFaq.answer}
                  onChange={(e) => setNewFaq({...newFaq, answer: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const Integrations = () => {
  const [connected, setConnected] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_SUCCESS') {
        setConnected(prev => [...prev, event.data.provider]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: string) => {
    try {
      const res = await axios.get(`/api/auth/${provider}/url`);
      window.open(res.data.url, 'oauth_popup', 'width=600,height=700');
    } catch (err) {
      alert('Failed to start connection.');
    }
  };

  const integrations = [
    { id: 'google', name: 'Google Calendar', description: 'Sync your tasks with your calendar.', icon: '📅' },
    { id: 'slack', name: 'Slack', description: 'Get notifications and create tasks from Slack messages.', icon: '💬' },
    { id: 'gmail', name: 'Gmail', description: 'Automate email replies directly from SmartDesk.', icon: '✉️' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Integrations</h2>
        <p className="text-slate-500">Connect SmartDesk AI with your favorite tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((it) => (
          <div key={it.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="text-4xl">{it.icon}</div>
              {connected.includes(it.id) && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Connected</span>
              )}
            </div>
            <h3 className="text-lg font-bold">{it.name}</h3>
            <p className="text-slate-500 text-sm mt-1">{it.description}</p>
            <button 
              onClick={() => handleConnect(it.id)}
              disabled={connected.includes(it.id)}
              className={`mt-6 w-full py-2 rounded-lg font-bold transition-all ${
                connected.includes(it.id) 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {connected.includes(it.id) ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="text-slate-500">Manage your account and application preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100">
          {['profile', 'security', 'notifications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 text-sm font-bold capitalize transition-all ${
                activeTab === tab 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'profile' && (
            <div className="max-w-xl space-y-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <UserIcon size={40} />
                </div>
                <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50">
                  Change Avatar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Full Name</label>
                  <input type="text" defaultValue={user?.name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email Address</label>
                  <input type="email" defaultValue={user?.email} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
                </div>
              </div>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="max-w-xl space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" />
              </div>
              <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                Update Password
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {[
                { label: 'Email Notifications', desc: 'Receive daily summaries of your tasks.' },
                { label: 'AI Insights', desc: 'Get AI-generated suggestions for your projects.' },
                { label: 'Team Activity', desc: 'Notify me when team members update tasks.' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EmailTools = () => {
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState('formal');

  const handleAction = async (action: string) => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post('/api/ai/email', { content, action, tone });
      setResult(res.data.text);
    } catch (err) {
      setResult('Failed to process email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Email Tools</h2>
        <p className="text-slate-500">Automate your email replies and summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Paste Email Content</label>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the email you want to reply to or summarize..."
              className="w-full h-64 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tone</label>
              <select 
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
              >
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="strict">Strict</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px] flex items-end gap-2">
              <button 
                onClick={() => handleAction('reply')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50"
              >
                Reply
              </button>
              <button 
                onClick={() => handleAction('summarize')}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 disabled:opacity-50"
              >
                Summarize
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              AI Result
            </h3>
            {loading && <span className="text-xs text-slate-400 animate-pulse">Processing...</span>}
          </div>
          <div className="flex-1 bg-slate-800/50 rounded-xl p-6 overflow-y-auto font-mono text-sm leading-relaxed">
            {result || <span className="text-slate-500 italic">Result will appear here...</span>}
          </div>
          <button 
            onClick={() => { navigator.clipboard.writeText(result); }}
            className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await axios.post(endpoint, {
        ...form,
        email: form.email.trim().toLowerCase()
      });
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      alert('Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
            S
          </div>
          <h1 className="text-2xl font-bold">SmartDesk AI</h1>
          <p className="text-slate-500 mt-2">{isRegister ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
          >
            {isRegister ? 'Sign Up' : 'Sign In'}
          </button>

          {!isRegister && (
            <button 
              type="button"
              onClick={() => setForm({ name: '', email: 'arumugams7312@gmail.com', password: 'password123' })}
              className="w-full py-2 text-indigo-600 text-sm font-bold hover:underline"
            >
              Try with Admin Credentials
            </button>
          )}
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-indigo-600 font-semibold hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export default function App() {
  const { user, loading, setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/auth/me');
        setUser(res.data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={user ? <DashboardLayout><Home /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/ai" element={user ? <DashboardLayout><AIChat /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/projects" element={user ? <DashboardLayout><Projects /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/tasks" element={user ? <DashboardLayout><Tasks /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/knowledge" element={user ? <DashboardLayout><KnowledgeBase /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/integrations" element={user ? <DashboardLayout><Integrations /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <DashboardLayout><SettingsPage /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="/email" element={user ? <DashboardLayout><EmailTools /></DashboardLayout> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
