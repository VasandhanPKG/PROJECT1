/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  CreditCard, 
  Bell, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { cn } from './utils';
import { Role, Student, TimetableEntry, Assignment, Notification } from './types';
import { MOCK_STUDENTS, MOCK_TIMETABLE, MOCK_ASSIGNMENTS, MOCK_NOTIFICATIONS, DEPARTMENT_SUBJECTS } from './mockData';

// --- Components ---

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; key?: React.Key; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn("bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden", className)}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  type = 'button',
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={cn("px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed", variants[variant], className)}
    >
      {children}
    </button>
  );
};

const Input = ({ label, ...props }: { label?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1">
    {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
    <input 
      {...props} 
      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [editAttempts, setEditAttempts] = useState(0);

  const randomStudent = useMemo(() => {
    if (students.length === 0) return null;
    return students[0]; // Use the first student as the "logged in" one for consistency
  }, [students]);

  const handleAssignmentSubmit = (id: string) => {
    setAssignments(prev => prev.map(a => 
      a.id === id ? { ...a, status: 'Submitted' } : a
    ));
    // Also add a notification
    const newNotification: Notification = {
      id: `N${Date.now()}`,
      title: 'Assignment Submitted',
      message: `You have successfully submitted the assignment: ${assignments.find(a => a.id === id)?.title}`,
      date: new Date().toISOString().split('T')[0],
      type: 'success'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Login state
  const [loginForm, setLoginForm] = useState({ username: '', password: '', role: 'student' as Role });

  useEffect(() => {
    // Migration: Clear old student data to ensure new format is used
    localStorage.removeItem('eduhub_students');
    
    const savedStudents = localStorage.getItem('eduhub_students_v3');
    if (savedStudents) {
      setStudents(JSON.parse(savedStudents));
    } else {
      setStudents(MOCK_STUDENTS);
      localStorage.setItem('eduhub_students_v3', JSON.stringify(MOCK_STUDENTS));
    }
  }, []);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    
    const { username, password, role: selectedRole } = loginForm;

    // Student login logic
    if (selectedRole === 'student') {
      const student = students.find(s => s.id === username && s.dob === password);
      if (student) {
        setRole('student');
        setIsLoggedIn(true);
        setActiveTab('dashboard');
      } else {
        setLoginError('Invalid Student ID or Date of Birth. Please check your credentials.');
      }
      return;
    }

    // Other roles login logic (faculty)
    const roleCredentials: Record<Role, { id: string; dob: string }> = {
      student: { id: '', dob: '' }, 
      faculty: { id: '123456789012', dob: '01/01/1980' }
    };

    const creds = roleCredentials[selectedRole];
    if (username === creds.id && password === creds.dob) {
      setRole(selectedRole);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    } else {
      setLoginError(`Invalid ${selectedRole} credentials. Please try again.`);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setRole(null);
  };

  // --- Views ---

  const FeesView = () => {
    const [paymentStep, setPaymentStep] = useState<'summary' | 'upi'>('summary');
    const [selectedBank, setSelectedBank] = useState<string | null>(null);

    if (paymentStep === 'upi') {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setPaymentStep('summary')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">UPI Payment</h2>
          </div>

          <Card className="p-8">
            <div className="text-center mb-8">
              <p className="text-sm text-slate-500 font-medium uppercase tracking-widest mb-1">Amount to Pay</p>
              <h3 className="text-4xl font-black text-slate-900">₹15,000</h3>
              {selectedBank && (
                <p className="text-xs text-blue-600 font-bold mt-2 uppercase tracking-wider">
                  Paying via {selectedBank}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 block mb-4">Choose UPI App</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Google Pay', color: 'bg-blue-50 text-blue-600', icon: 'G' },
                  { name: 'PhonePe', color: 'bg-purple-50 text-purple-600', icon: 'P' },
                  { name: 'Paytm', color: 'bg-sky-50 text-sky-600', icon: 'Py' },
                  { name: 'Amazon Pay', color: 'bg-orange-50 text-orange-600', icon: 'A' },
                ].map((upi) => (
                  <button 
                    key={upi.name}
                    className="flex items-center space-x-4 p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:bg-slate-50 transition-all group"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg", upi.color)}>
                      {upi.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{upi.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Fast & Secure</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-blue-500" />
                  </button>
                ))}
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">or enter UPI ID</span>
                </div>
              </div>

              <div className="space-y-2">
                <Input placeholder="e.g. username@okaxis" />
                <Button className="w-full py-4 rounded-2xl">Verify & Pay</Button>
              </div>
            </div>
          </Card>

          <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
            By proceeding, you agree to our terms of service. <br />
            Payments are secured by 256-bit encryption.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">Fee Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-blue-600 text-white">
            <p className="text-sm opacity-80">Total Fees</p>
            <h3 className="text-3xl font-bold">₹75,000</h3>
          </Card>
          <Card className="p-6 bg-green-600 text-white">
            <p className="text-sm opacity-80">Paid Amount</p>
            <h3 className="text-3xl font-bold">₹60,000</h3>
          </Card>
          <Card className="p-6 bg-orange-600 text-white">
            <p className="text-sm opacity-80">Balance Due</p>
            <h3 className="text-3xl font-bold">₹15,000</h3>
          </Card>
        </div>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Payment History</h3>
          <div className="space-y-4">
            {[
              { date: '2026-01-15', amount: '₹30,000', method: 'Online Banking', bank: 'HDFC Bank', status: 'Success' },
              { date: '2025-08-10', amount: '₹30,000', method: 'Credit Card', bank: 'ICICI Bank', status: 'Success' },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{p.amount}</p>
                    <p className="text-xs text-slate-500">{p.method} • {p.bank} • {p.date}</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-full uppercase">
                  {p.status}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Select Bank for Payment</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'KOTAK', 'IOB'].map(bank => (
                  <button 
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={cn(
                      "px-4 py-3 border rounded-xl text-xs font-bold transition-all text-center",
                      selectedBank === bank 
                        ? "border-blue-600 bg-blue-50 text-blue-600 shadow-sm" 
                        : "border-slate-200 text-slate-600 hover:border-blue-500 hover:bg-blue-50"
                    )}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
            <Button 
              className="w-full" 
              onClick={() => setPaymentStep('upi')}
              disabled={!selectedBank}
            >
              Pay Balance Now
            </Button>
            {!selectedBank && (
              <p className="text-[10px] text-center text-slate-400 font-medium">Please select a bank to proceed</p>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const Dashboard = () => {
    const [showMorePerformance, setShowMorePerformance] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const stats = [
      { label: 'Attendance', value: '92%', icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-50', tab: 'attendance' },
      { label: 'Assignments', value: '12/15', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'assignments' },
      { label: 'CGPA', value: '9.2', icon: GraduationCap, color: 'text-purple-600', bg: 'bg-purple-50', tab: 'exams' },
    ];

    const chartData = [
      { name: 'Jan', present: 26, absent: 2, late: 2, performance: 85 },
      { name: 'Feb', present: 24, absent: 4, late: 2, performance: 82 },
      { name: 'Mar', present: 27, absent: 1, late: 2, performance: 90 },
      { name: 'Apr', present: 28, absent: 1, late: 1, performance: 88 },
      { name: 'May', present: 25, absent: 3, late: 2, performance: 86 },
      { name: 'Jun', present: 26, absent: 2, late: 2, performance: 91 },
      { name: 'Jul', present: 23, absent: 5, late: 2, performance: 80 },
      { name: 'Aug', present: 25, absent: 3, late: 2, performance: 84 },
    ];

    const displayData = showMorePerformance ? chartData : chartData.slice(0, 4);

    const dailyPerformance = useMemo(() => {
      if (!selectedMonth) return [];
      // Generate 30 days of performance data for the selected month
      return Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        performance: Math.floor(Math.random() * 40) + 60, // 60-100
        attendance: Math.random() > 0.1 ? 'Present' : 'Absent'
      }));
    }, [selectedMonth]);

    return (
      <div className="space-y-6">
        {role === 'student' && randomStudent && (
          <Card 
            className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none cursor-pointer hover:shadow-lg transition-all active:scale-[0.99]"
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                {randomStudent.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm opacity-80">Welcome back,</p>
                <h2 className="text-2xl font-bold">{randomStudent.name}</h2>
              </div>
            </div>
          </Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <Card 
              key={i} 
              className="p-6 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-all active:scale-95"
              onClick={() => setActiveTab(stat.tab)}
            >
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">Performance Overview</h3>
              <button 
                onClick={() => setShowMorePerformance(!showMorePerformance)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 transition-colors"
              >
                <span>{showMorePerformance ? 'Show Less' : 'Show More'}</span>
                {showMorePerformance ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <div className={cn("transition-all duration-300", showMorePerformance ? "h-80" : "h-64")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={displayData}
                  onClick={(data) => {
                    if (data && data.activeLabel) {
                      setSelectedMonth(data.activeLabel);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    domain={[0, 30]}
                    label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="present" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} className="cursor-pointer" />
                  <Bar dataKey="late" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} className="cursor-pointer" />
                  <Bar dataKey="absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} className="cursor-pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-center space-x-6 text-[10px] font-medium text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span>Late</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Absent</span>
              </div>
            </div>

            <AnimatePresence>
              {selectedMonth && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 pt-6 border-t border-slate-100 overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-900">Daily Performance: {selectedMonth}</h4>
                    <button 
                      onClick={() => setSelectedMonth(null)}
                      className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider"
                    >
                      Close Details
                    </button>
                  </div>
                  <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {dailyPerformance.map((day) => (
                      <div 
                        key={day.day}
                        title={`Day ${day.day}: ${day.performance}% Performance - ${day.attendance}`}
                        className={cn(
                          "aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110 cursor-help",
                          day.attendance === 'Present' 
                            ? day.performance >= 90 ? "bg-green-500 text-white" : "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {day.day}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center space-x-4 text-[9px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-sm bg-green-500" />
                      <span>Excellent (90%+)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-sm bg-green-100" />
                      <span>Good</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-sm bg-red-100" />
                      <span>Absent</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Notifications</h3>
            <div className="space-y-4">
              {notifications.slice(0, 3).map((n) => (
                <div key={n.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    "mt-1 p-2 rounded-full",
                    n.type === 'info' ? 'bg-blue-100 text-blue-600' : 
                    n.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                  )}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{n.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const Timetable = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Weekly Timetable</h2>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-xs">Download PDF</Button>
          <Button variant="outline" className="text-xs">Print</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {MOCK_TIMETABLE.map((day, i) => (
          <Card key={i} className="flex flex-col">
            <div className="bg-blue-600 p-3 text-white font-bold text-center">
              {day.day}
            </div>
            <div className="p-4 space-y-4 flex-1">
              {day.slots.map((slot, j) => (
                <div key={j} className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{slot.time}</p>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{slot.subject}</h4>
                  <div className="flex items-center text-xs text-slate-500 mt-2">
                    <MapPin className="w-3 h-3 mr-1" /> {slot.room}
                  </div>
                  <div className="flex items-center text-xs text-slate-500 mt-1">
                    <Users className="w-3 h-3 mr-1" /> {slot.faculty}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const Attendance = () => {
    const [visibleCount, setVisibleCount] = useState(10);
    const attendanceData = [
      { name: 'Present', value: 85 },
      { name: 'Absent', value: 10 },
      { name: 'Late', value: 5 },
    ];
    const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

    const currentStudent = useMemo(() => {
      return students[0]; 
    }, [students]);

    const studentSubjects = currentStudent?.subjects || DEPARTMENT_SUBJECTS['Computer Science'];

    // Mock data for full day history
    const dailyHistory = useMemo(() => {
      const history = [];
      // Generate for February 2026 (28 days)
      for (let i = 28; i >= 1; i--) {
        const date = new Date(2026, 1, i); // February 2026
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        const daySubjects = studentSubjects.slice(0, 6).map((subject, idx) => {
          const startHour = 9 + idx;
          const endHour = startHour + 1;
          const formatHour = (h: number) => {
            const period = h >= 12 ? 'PM' : 'AM';
            const displayHour = h > 12 ? h - 12 : h;
            return `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
          };
          return {
            subject,
            time: `${formatHour(startHour)} - ${formatHour(endHour)}`,
            status: Math.random() > 0.1 ? 'Present' : 'Absent'
          };
        });

        history.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          subjects: daySubjects,
          overall: daySubjects.every(s => s.status === 'Present') ? 'Full' : 'Partial'
        });
      }
      return history;
    }, [studentSubjects]);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-1">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Attendance Summary</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {attendanceData.map((d, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs text-slate-600">{d.name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Full Day Attendance History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P1</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P2</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P3</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P4</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P5</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-center">P6</th>
                    <th className="px-4 py-3 font-bold text-slate-700 text-[11px] uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyHistory.slice(0, visibleCount).map((day, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 text-xs font-medium text-slate-900 whitespace-nowrap">{day.date}</td>
                      {[...Array(6)].map((_, sIdx) => {
                        const s = day.subjects[sIdx];
                        return (
                          <td key={sIdx} className="px-4 py-4 text-center">
                            {s ? (
                              <div 
                                title={`${s.subject} (${s.time}) - ${s.status}`}
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full mx-auto cursor-help",
                                  s.status === 'Present' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                                )} 
                              />
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mx-auto" title="No Class" />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-4 text-right">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase",
                          day.overall === 'Full' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                        )}>
                          {day.overall}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {visibleCount < dailyHistory.length && (
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="flex items-center space-x-2 px-6 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all active:scale-95"
                >
                  <span>Show More History</span>
                  <ChevronRight className="w-3 h-3 rotate-90" />
                </button>
              </div>
            )}

            <div className="mt-6 flex items-center space-x-6 text-[10px] font-medium text-slate-400 border-t border-slate-50 pt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Present</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>Absent</span>
              </div>
              <p className="italic ml-auto">Hover over dots to see subject details</p>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const Assignments = () => {
    const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (selectedAssignment) {
      const handleSubmit = async () => {
        setIsSubmitting(true);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        handleAssignmentSubmit(selectedAssignment.id);
        setIsSubmitting(false);
      };

      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSelectedAssignmentId(null)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 rotate-180" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900">Assignment Details</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedAssignment.title}</h3>
                    <p className="text-slate-500 font-medium mt-1">{selectedAssignment.subject}</p>
                  </div>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider",
                    selectedAssignment.status === 'Pending' ? "bg-orange-100 text-orange-600" : 
                    selectedAssignment.status === 'Submitted' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                  )}>
                    {selectedAssignment.status}
                  </span>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Description</h4>
                    <p className="text-slate-600 leading-relaxed">
                      {selectedAssignment.description || "No description provided."}
                    </p>
                  </div>

                  {selectedAssignment.instructions && (
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-3">Instructions</h4>
                      <ul className="space-y-3">
                        {selectedAssignment.instructions.map((instruction, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-slate-600">
                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            <span className="text-sm">{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              {selectedAssignment.status === 'Pending' ? (
                <Card className="p-8 border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                      {isSubmitting ? (
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="w-8 h-8 text-blue-600" />
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">
                      {isSubmitting ? "Uploading..." : "Submit Assignment"}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 mb-6">Upload your files here (PDF, DOCX, ZIP)</p>
                    <div className="flex justify-center space-x-3">
                      <Button variant="outline" disabled={isSubmitting}>Choose Files</Button>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-8"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Now"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 bg-green-50 border border-green-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-green-900">Assignment Submitted</h4>
                      <p className="text-sm text-green-700">Your files have been successfully uploaded and are awaiting review.</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Submission Info</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium uppercase">Due Date</span>
                    <span className="text-sm font-bold text-slate-900">{selectedAssignment.dueDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium uppercase">Status</span>
                    <span className="text-sm font-bold text-slate-900">{selectedAssignment.status}</span>
                  </div>
                  {selectedAssignment.grade && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-medium uppercase">Grade</span>
                      <span className="text-lg font-black text-green-600">{selectedAssignment.grade}</span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-blue-600 text-white">
                <h4 className="text-sm font-bold opacity-80 uppercase tracking-widest mb-4">Need Help?</h4>
                <p className="text-xs leading-relaxed opacity-90 mb-4">
                  If you have any questions regarding this assignment, please contact your faculty.
                </p>
                <Button variant="secondary" className="w-full text-xs">Contact Faculty</Button>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Assignments</h2>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" /> <span>Submit New</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {assignments.map((a) => (
            <Card key={a.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{a.title}</h4>
                  <p className="text-sm text-slate-500">{a.subject}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-xs text-slate-400">
                      <Clock className="w-3 h-3 mr-1" /> Due: {a.dueDate}
                    </span>
                    {a.grade && (
                      <span className="flex items-center text-xs font-bold text-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Grade: {a.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase",
                  a.status === 'Pending' ? "bg-orange-100 text-orange-600" : 
                  a.status === 'Submitted' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {a.status}
                </span>
                <Button 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => setSelectedAssignmentId(a.id)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const FacultyAttendance = () => {
    const [selectedCourse, setSelectedCourse] = useState('Computer Science');
    const [selectedSubject, setSelectedSubject] = useState(DEPARTMENT_SUBJECTS['Computer Science'][0]);

    useEffect(() => {
      if (DEPARTMENT_SUBJECTS[selectedCourse]) {
        setSelectedSubject(DEPARTMENT_SUBJECTS[selectedCourse][0]);
      }
    }, [selectedCourse]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Mark Attendance</h2>
          <div className="flex flex-col md:flex-row gap-2">
            <select 
              className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {Object.keys(DEPARTMENT_SUBJECTS).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <select 
              className="px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              {Array.from(new Set(DEPARTMENT_SUBJECTS[selectedCourse] || [])).map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Student ID</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Name</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.filter(s => s.course === selectedCourse).map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{s.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{s.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                        <button className="px-3 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200">Present</button>
                        <button className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200">Absent</button>
                        <button className="px-3 py-1 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-200">Late</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="flex justify-end">
          <Button className="px-8">Submit Attendance for {selectedSubject}</Button>
        </div>
      </div>
    );
  };

  const StudentManagement = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStudent, setNewStudent] = useState<Partial<Student>>({
      id: '',
      name: '',
      course: 'Computer Science',
      year: '1st',
      subjects: DEPARTMENT_SUBJECTS['Computer Science']
    });

    const handleCourseChange = (course: string) => {
      setNewStudent({
        ...newStudent,
        course,
        subjects: DEPARTMENT_SUBJECTS[course] || []
      });
    };

    const handleAddStudent = (e: React.FormEvent) => {
      e.preventDefault();
      if (newStudent.id && newStudent.name) {
        // Ensure unique subjects before adding
        const uniqueSubjects = Array.from(new Set(newStudent.subjects || []));
        
        const studentToAdd = {
          ...newStudent,
          subjects: uniqueSubjects,
          dob: '01/01/2005', // Default DOB for mock
          age: 21,
          gender: 'Male',
          email: `${newStudent.name?.toLowerCase().replace(' ', '.')}@email.com`,
          phone: '+91-0000000000',
          city: 'Unknown'
        } as Student;
        
        const updatedStudents = [...students, studentToAdd];
        setStudents(updatedStudents);
        localStorage.setItem('eduhub_students_v3', JSON.stringify(updatedStudents));
        setShowAddModal(false);
        setNewStudent({
          id: '',
          name: '',
          course: 'Computer Science',
          year: '1st',
          subjects: DEPARTMENT_SUBJECTS['Computer Science']
        });
      }
    };

    const deleteStudent = (id: string) => {
      const updatedStudents = students.filter(s => s.id !== id);
      setStudents(updatedStudents);
      localStorage.setItem('eduhub_students_v3', JSON.stringify(updatedStudents));
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">Student Management</h2>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
            <Plus className="w-4 h-4" /> <span>Add Student</span>
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Student ID</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Name</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Department</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Subjects</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 text-sm font-medium text-blue-600">{s.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.course}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {s.subjects?.slice(0, 3).map((sub, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                            {sub}
                          </span>
                        ))}
                        {s.subjects && s.subjects.length > 3 && (
                          <span className="text-[10px] text-slate-400">+{s.subjects.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center space-x-2">
                        <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteStudent(s.id)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add Student Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Add New Student</h3>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                  <Input 
                    label="Student ID" 
                    placeholder="e.g. 732925CSR011" 
                    value={newStudent.id}
                    onChange={(e) => setNewStudent({...newStudent, id: e.target.value.toUpperCase()})}
                    required 
                  />
                  <Input 
                    label="Full Name" 
                    placeholder="e.g. John Doe" 
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    required 
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Department</label>
                    <select 
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={newStudent.course}
                      onChange={(e) => handleCourseChange(e.target.value)}
                    >
                      {Object.keys(DEPARTMENT_SUBJECTS).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Subjects (Predicted - Editable)</label>
                    <textarea 
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-24 text-sm"
                      value={newStudent.subjects?.join(', ')}
                      onChange={(e) => {
                        const subjects = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                        // We don't remove duplicates here to allow user to type, 
                        // but we'll ensure uniqueness on blur or on add.
                        // Actually, let's just ensure uniqueness on add for better UX while typing.
                        setNewStudent({...newStudent, subjects});
                      }}
                      placeholder="Enter subjects separated by commas"
                    />
                    <p className="text-[10px] text-slate-400 italic">Subjects are automatically suggested based on the selected department.</p>
                  </div>
                  <div className="flex space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
                    <Button type="submit" className="flex-1">Add Student</Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ExamResultsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Exams & Results</h2>
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Exam Schedule</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 font-bold text-slate-700">Date</th>
                <th className="pb-3 font-bold text-slate-700">Subject</th>
                <th className="pb-3 font-bold text-slate-700">Time</th>
                <th className="pb-3 font-bold text-slate-700">Venue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { date: '2026-05-10', subject: 'Data Structures', time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
                { date: '2026-05-12', subject: 'Algorithms', time: '10:00 AM - 01:00 PM', venue: 'Hall B' },
                { date: '2026-05-14', subject: 'Operating Systems', time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
                { date: '2026-05-16', subject: 'Database Systems', time: '10:00 AM - 01:00 PM', venue: 'Hall C' },
                { date: '2026-05-18', subject: 'Networking', time: '10:00 AM - 01:00 PM', venue: 'Hall B' },
                { date: '2026-05-20', subject: 'Discrete Math', time: '10:00 AM - 01:00 PM', venue: 'Hall A' },
              ].map((e, i) => (
                <tr key={i}>
                  <td className="py-3 text-sm text-slate-600">{e.date}</td>
                  <td className="py-3 text-sm font-bold text-slate-900">{e.subject}</td>
                  <td className="py-3 text-sm text-slate-500">{e.time}</td>
                  <td className="py-3 text-sm text-slate-500">{e.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-6">Previous Semester Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { subject: 'Data Structures', marks: 85, total: 100, grade: 'A+' },
            { subject: 'Algorithms', marks: 78, total: 100, grade: 'A' },
            { subject: 'Operating Systems', marks: 92, total: 100, grade: 'O' },
            { subject: 'Database Systems', marks: 88, total: 100, grade: 'A+' },
            { subject: 'Networking', marks: 82, total: 100, grade: 'A+' },
            { subject: 'Discrete Math', marks: 95, total: 100, grade: 'O' },
          ].map((r, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">{r.subject}</p>
                <p className="text-xs text-slate-500">{r.marks}/{r.total} Marks</p>
              </div>
              <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-black text-blue-600">
                {r.grade}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setActiveTab('assessment')}>Take Online Assessment</Button>
      </div>
    </div>
  );

  const AssessmentQuiz = () => {
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);

    const questions = [
      { 
        q: "Which of the following is a non-volatile memory?", 
        a: ["RAM", "ROM", "Cache", "Register"],
        correct: 1 
      },
      { 
        q: "What is the time complexity of searching an element in a balanced Binary Search Tree?", 
        a: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        correct: 1 
      },
      { 
        q: "Which protocol is used for secure communication over the internet?", 
        a: ["HTTP", "FTP", "HTTPS", "SMTP"],
        correct: 2 
      },
      { 
        q: "What is the main purpose of an Operating System?", 
        a: ["To design web pages", "To manage hardware and software resources", "To perform complex calculations", "To create databases"],
        correct: 1 
      },
      { 
        q: "Which data structure is used for Breadth First Search (BFS) in a graph?", 
        a: ["Stack", "Queue", "Linked List", "Tree"],
        correct: 1 
      },
    ];

    const handleAnswer = (index: number) => {
      if (isAnswered) return;
      setSelectedOption(index);
      setIsAnswered(true);
      if (index === questions[step].correct) {
        setScore(score + 1);
      }
    };

    const handleNext = () => {
      setStep(step + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    };

    const handleReset = () => {
      setStep(0);
      setScore(0);
      setSelectedOption(null);
      setIsAnswered(false);
    };

    if (step >= questions.length) {
      return (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900">Assessment Completed!</h3>
          <p className="text-slate-500 mt-2">Your score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)</p>
          <div className="mt-8 flex justify-center space-x-4">
            <Button variant="outline" onClick={() => setActiveTab('exams')}>Back to Exams</Button>
            <Button onClick={handleReset}>Retake Quiz</Button>
          </div>
        </Card>
      );
    }

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">Assessment</p>
            <h2 className="text-2xl font-bold text-slate-900">Computer Science Fundamentals</h2>
          </div>
          <span className="text-sm font-medium text-slate-500">Question {step + 1} of {questions.length}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-600"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          />
        </div>
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8">{questions[step].q}</h3>
          <div className="space-y-3">
            {questions[step].a.map((opt, i) => {
              const isCorrect = i === questions[step].correct;
              const isSelected = i === selectedOption;
              
              let buttonClass = "w-full text-left px-6 py-4 rounded-xl border transition-all font-medium flex justify-between items-center group ";
              if (isAnswered) {
                if (isCorrect) {
                  buttonClass += "border-green-500 bg-green-50 text-green-700";
                } else if (isSelected) {
                  buttonClass += "border-red-500 bg-red-50 text-red-700";
                } else {
                  buttonClass += "border-slate-200 text-slate-400 opacity-50";
                }
              } else {
                buttonClass += "border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700";
              }

              return (
                <button 
                  key={i}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(i)}
                  className={buttonClass}
                >
                  <span className="flex items-center">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-4 text-xs font-bold text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                  </span>
                  {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  {!isAnswered && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 flex justify-between items-center p-4 bg-slate-50 rounded-xl"
            >
              <p className="text-sm text-slate-600">
                {selectedOption === questions[step].correct ? (
                  <span className="text-green-600 font-bold">Correct! Well done.</span>
                ) : (
                  <span>
                    <span className="text-red-600 font-bold">Incorrect.</span> The correct answer is: <span className="font-bold text-slate-900">{questions[step].a[questions[step].correct]}</span>
                  </span>
                )}
              </p>
              <Button onClick={handleNext}>
                {step === questions.length - 1 ? "Finish Assessment" : "Next Question"}
              </Button>
            </motion.div>
          )}
        </Card>
      </div>
    );
  };

  const PersonalDetails = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Student>>({});

    useEffect(() => {
      if (randomStudent) {
        setFormData(randomStudent);
      }
    }, [randomStudent]);

    if (!randomStudent) return null;

    const handleSave = () => {
      if (editAttempts >= 3) return;
      setStudents(prev => prev.map(s => s.id === randomStudent.id ? { ...s, ...formData } as Student : s));
      setEditAttempts(prev => prev + 1);
      setIsEditing(false);
    };

    const details = [
      { label: 'Full Name', value: randomStudent.name, icon: Users, key: 'name' },
      { label: 'Student ID', value: randomStudent.id, icon: GraduationCap, key: 'id' },
      { label: 'Email Address', value: randomStudent.email, icon: Bell, key: 'email' },
      { label: 'Phone Number', value: randomStudent.phone, icon: ClipboardCheck, key: 'phone' },
      { label: 'Date of Birth', value: randomStudent.dob, icon: Calendar, key: 'dob' },
      { label: 'Gender', value: randomStudent.gender, icon: Users, key: 'gender' },
      { label: 'Course', value: randomStudent.course, icon: BookOpen, key: 'course' },
      { label: 'Year', value: randomStudent.year, icon: Clock, key: 'year' },
      { label: 'City', value: randomStudent.city, icon: MapPin, key: 'city' },
    ];

    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {isEditing ? 'Edit Profile' : 'Personal Details'}
          </h2>
          <div className="flex space-x-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setActiveTab('dashboard')}>Back to Dashboard</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="p-8 text-center md:col-span-1">
            <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center text-5xl font-black mx-auto mb-6 shadow-xl shadow-blue-200">
              {formData.name?.charAt(0) || randomStudent.name.charAt(0)}
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{formData.name || randomStudent.name}</h3>
            <p className="text-slate-500 font-medium mt-1">{formData.course || randomStudent.course}</p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="px-4 py-1.5 bg-green-100 text-green-600 rounded-full text-xs font-bold uppercase tracking-wider">
                Active Student
              </span>
            </div>
          </Card>

          <Card className="p-8 md:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {details.map((detail, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{detail.label}</p>
                  {isEditing ? (
                    <div className="flex items-center space-x-2">
                      <detail.icon className="w-4 h-4 text-blue-600" />
                      <input
                        type="text"
                        value={(formData as any)[detail.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [detail.key]: e.target.value })}
                        className="w-full px-2 py-1 border-b border-blue-200 focus:border-blue-600 outline-none font-bold text-slate-900 bg-blue-50/30 rounded"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <detail.icon className="w-4 h-4 text-blue-600" />
                      <p className="text-slate-900 font-bold">{detail.value}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isEditing && (
              <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-end space-y-3">
                <div className="flex items-center space-x-2 text-sm font-medium">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
                    editAttempts >= 3 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {3 - editAttempts} Attempts Remaining
                  </span>
                  <p className="text-slate-400">Profile editing is limited to 3 attempts.</p>
                </div>
                <Button 
                  className="px-8" 
                  onClick={() => setIsEditing(true)}
                  disabled={editAttempts >= 3}
                >
                  {editAttempts >= 3 ? 'Limit Reached' : 'Edit Profile'}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  // --- Layout ---

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[400px]"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-light tracking-tight text-slate-900">EduHub</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest">Academic Portal</p>
          </div>

          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 rounded-3xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                {(['student', 'faculty'] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setLoginForm({ ...loginForm, role: r });
                      setLoginError(null);
                    }}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-bold rounded-xl transition-all capitalize tracking-wider",
                      loginForm.role === r ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <Input 
                  label={loginForm.role === 'student' ? "Student ID" : "Username"}
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value.toUpperCase() })}
                  required
                />
                
                <div className="space-y-2">
                  <Input 
                    label="Password (DOB)" 
                    type={showPassword ? "text" : "password"} 
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center space-x-1"
                    >
                      {showPassword ? (
                        <>
                          <X className="w-3 h-3" />
                          <span>Hide Password</span>
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3 h-3" />
                          <span>Show Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 font-medium leading-relaxed">{loginError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide shadow-lg shadow-blue-200">
                Sign In
              </Button>
            </form>
          </Card>
          
          <p className="text-center mt-8 text-slate-400 text-xs font-medium">
            &copy; 2026 EduHub Systems. All rights reserved.
          </p>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'faculty'] },
    { id: 'students', label: 'Students', icon: Users, roles: ['faculty'] },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['student', 'faculty'] },
    { id: 'timetable', label: 'Timetable', icon: Calendar, roles: ['student', 'faculty'] },
    { id: 'assignments', label: 'Assignments', icon: BookOpen, roles: ['student', 'faculty'] },
    { id: 'exams', label: 'Exams & Results', icon: FileText, roles: ['student', 'faculty'] },
    { id: 'fees', label: 'Fees', icon: CreditCard, roles: ['student'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['student', 'faculty'] },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(role!));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transition-transform lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-900 tracking-tight">EduHub</span>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {filteredMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
                {activeTab === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center space-x-4 ml-auto">
            <button className="p-2 rounded-full hover:bg-slate-100 relative">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 capitalize">{role} User</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role} Portal</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold">
                {role?.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'profile' && <PersonalDetails />}
              {activeTab === 'attendance' && (role === 'faculty' ? <FacultyAttendance /> : <Attendance />)}
              {activeTab === 'students' && role === 'faculty' && <StudentManagement />}
              {activeTab === 'timetable' && <Timetable />}
              {activeTab === 'assignments' && <Assignments />}
              {activeTab === 'exams' && <ExamResultsView />}
              {activeTab === 'assessment' && <AssessmentQuiz />}
              {activeTab === 'fees' && <FeesView />}
              {activeTab === 'notifications' && (
                <div className="max-w-3xl mx-auto space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Notifications</h2>
                  {notifications.map((n) => (
                    <Card key={n.id} className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "p-3 rounded-xl",
                          n.type === 'info' ? 'bg-blue-50 text-blue-600' : 
                          n.type === 'warning' ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-600'
                        )}>
                          <Bell className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold text-slate-900">{n.title}</h4>
                            <span className="text-xs text-slate-400">{n.date}</span>
                          </div>
                          <p className="text-slate-600 mt-2">{n.message}</p>
                          <div className="mt-4 flex space-x-2">
                            <Button variant="outline" className="text-xs">Mark as Read</Button>
                            <Button variant="secondary" className="text-xs">Delete</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
