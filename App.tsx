import React from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import {BrowserRouter, Routes, Route, useNavigate, useLocation} from 'react-router-dom';
import {Navbar} from './src/components/Navbar';
import {NewTask} from './src/pages/NewTask';
import {Today} from './src/pages/Today';
import {TaskDetail} from './src/pages/TaskDetail';

type Page = 'today' | 'calendar' | 'newTask' | 'taskDetail';

function AppContent(): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.layout}>
        <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
        <View style={styles.mainContent} data-main-content>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/new-task" element={<NewTask />} />
            <Route path="/task" element={<TaskDetail />} />
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
});

export default App;
