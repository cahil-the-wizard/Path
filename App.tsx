import React, {useEffect, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View, ActivityIndicator} from 'react-native';
import {BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate} from 'react-router-dom';
import {Navbar} from './src/components/Navbar';
import {NewTask} from './src/pages/NewTask';
import {Today} from './src/pages/Today';
import {TaskDetail} from './src/pages/TaskDetail';
import {Auth} from './src/pages/Auth';
import {authService} from './src/services/auth';
import {colors} from './src/theme/tokens';

type Page = 'today' | 'calendar' | 'newTask' | 'taskDetail';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await authService.restoreSession();
        setIsAuthenticated(authService.isAuthenticated());
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    // Update auth state when location changes
    setIsAuthenticated(authService.isAuthenticated());
  }, [location]);

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.indigo[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const pathToPage: Record<string, Page> = {
    '/': 'today',
    '/new-task': 'newTask',
    '/task': 'taskDetail',
  };

  const pageToPath: Record<Page, string> = {
    'today': '/',
    'newTask': '/new-task',
    'taskDetail': '/task',
    'calendar': '/calendar',
  };

  const currentPage = pathToPage[location.pathname] || 'today';

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
              path="/new-task"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <NewTask />
                </ProtectedRoute>
              }
            />
            <Route
              path="/task"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <TaskDetail />
                </ProtectedRoute>
              }
            />
          </Routes>
        </View>
      </View>
    </SafeAreaView>
  );
}

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AppContent />
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
