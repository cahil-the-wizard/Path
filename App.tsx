import React, {useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, View} from 'react-native';
import {Navbar} from './src/components/Navbar';
import {NewTask} from './src/pages/NewTask';
import {Today} from './src/pages/Today';
import {TaskDetail} from './src/pages/TaskDetail';

type Page = 'today' | 'calendar' | 'newTask' | 'taskDetail';

function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<Page>('today');

  const renderPage = () => {
    switch (currentPage) {
      case 'today':
        return <Today />;
      case 'newTask':
        return <NewTask />;
      case 'taskDetail':
        return <TaskDetail />;
      default:
        return <Today />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.layout}>
        <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
        <View style={styles.mainContent} data-main-content>
          {renderPage()}
        </View>
      </View>
    </SafeAreaView>
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
