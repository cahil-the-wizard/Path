import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator} from 'react-native';
import {BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate} from 'react-router-dom';
import {Navbar} from './src/components/Navbar';
import {NewTask} from './src/pages/NewTask';
import {Today} from './src/pages/Today';
import {TodayV2} from './src/pages/TodayV2';
import {TaskDetail} from './src/pages/TaskDetail';
import {TasksList} from './src/pages/TasksList';
import {Auth} from './src/pages/Auth';
// import {Settings} from './src/pages/Settings';
import {colors} from './src/theme/tokens';
import {TasksProvider} from './src/contexts/TasksContext';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';

type Page = 'today' | 'todayV2' | 'newTask' | 'tasksList' | 'taskDetail' | 'settings';

interface ProtectedRouteProps {
  children: React.ReactElement;
  isAuthenticated: boolean;
}

function ProtectedRoute({children, isAuthenticated}: ProtectedRouteProps): React.JSX.Element {
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}

function AppContent(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const {isAuthenticated, isInitializing} = useAuth();

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.indigo[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const getPageFromPath = (pathname: string): Page => {
    if (pathname === '/') return 'today';
    if (pathname === '/today-v2') return 'todayV2';
    if (pathname === '/new-task') return 'newTask';
    if (pathname === '/tasks') return 'tasksList';
    if (pathname.startsWith('/task/')) return 'taskDetail';
    if (pathname === '/settings') return 'settings';
    return 'today';
  };

  const pageToPath: Record<Page, string> = {
    'today': '/',
    'todayV2': '/today-v2',
    'newTask': '/new-task',
    'tasksList': '/tasks',
    'taskDetail': '/task',
    'settings': '/settings',
  };

  const currentPage = getPageFromPath(location.pathname);

  const handleNavigate = (page: Page) => {
    navigate(pageToPath[page]);
  };

  // Check if current route is auth page
  const isAuthPage = location.pathname === '/auth';

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <TasksProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.layout}>
          <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
          <View style={styles.mainContent} data-main-content>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <Today />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/today-v2"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <TodayV2 />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-task"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <NewTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <TasksList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/task/:taskSlug"
                element={
                  <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <TaskDetail />
                  </ProtectedRoute>
                }
              />
              {/* <Route
              path="/settings"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Settings />
                </ProtectedRoute>
              }
            /> */}
            </Routes>
          </View>
        </View>
      </SafeAreaView>
    </TasksProvider>
  );
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
