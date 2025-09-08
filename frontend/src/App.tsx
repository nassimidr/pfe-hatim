import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { TaskProvider } from "./contexts/TaskContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout/Layout"
import NotificationManager from "./components/NotificationManager"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import Dashboard from "./pages/Dashboard"
import MyTasks from "./pages/MyTasks"
import CreateTask from "./pages/CreateTask"
import TaskHistory from "./pages/TaskHistory"
import TaskDetails from "./pages/TaskDetails"
import Statistics from "./pages/Statistics"
import AdminPanel from "./pages/AdminPanel"
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Profile from "./pages/Profile";
import React, { createContext, useContext, useEffect, useState } from 'react';
// Retirer l'import du composant AIHelper
// import AIHelper from './components/AIHelper';

// Contexte pour le thème
const ThemeContext = createContext<{
  theme: 'light' | 'dark',
  toggleTheme: () => void
}>({ theme: 'light', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AppContent() {
  return (
    <TaskProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* <AIHelper /> */}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MyTasks />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tasks/:taskId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-task"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CreateTask />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TaskHistory />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Statistics />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Projects />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProjectDetails />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <NotificationManager />
        </div>
      </Router>
    </TaskProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
