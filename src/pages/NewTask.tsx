import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {TextInput} from '../components/TextInput';
import {Button} from '../components/Button';
import {CirclePlus, Paperclip, Mic, ArrowRight} from 'lucide-react-native';
import {colors} from '../theme/tokens';

export const NewTask: React.FC = () => {
  const [taskInput, setTaskInput] = useState('');

  return (
    <View style={styles.container}>
      <PageHeader title="Add task" icon={CirclePlus} />
      <View style={styles.content}>
        <View style={styles.centeredContent}>
          <View style={styles.body}>
            <View style={styles.mainContent}>
              <Text style={styles.heading}>
                <Text style={styles.headingGray}>Every path,{'\n'}</Text>
                <Text style={styles.headingDark}>starts with a single step.</Text>
              </Text>

              <View style={styles.inputCard}>
                <View style={styles.inputContainer}>
                  <TextInput
                    placeholder="Tell me about the task you are struggling with"
                    value={taskInput}
                    onChangeText={setTaskInput}
                  />

                  <View style={styles.actions}>
                    <View style={styles.leftActions}>
                      <Button
                        variant="tertiary"
                        size="large"
                        label=""
                        leftIcon={Paperclip}
                      />
                    </View>
                    <View style={styles.rightActions}>
                      <Button
                        variant="ghost"
                        size="large"
                        label=""
                        leftIcon={Mic}
                      />
                      <Button
                        variant="primary"
                        size="large"
                        label=""
                        leftIcon={ArrowRight}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -120,
  },
  body: {
    maxWidth: 600,
    width: '100%',
  },
  mainContent: {
    width: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 24,
  },
  heading: {
    width: '100%',
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 39.68,
    textAlign: 'center',
  },
  headingGray: {
    color: colors.gray.light[500],
  },
  headingDark: {
    color: colors.gray.light[900],
  },
  inputCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  inputContainer: {
    alignSelf: 'stretch',
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 16,
  },
  actions: {
    alignSelf: 'stretch',
    paddingLeft: 16,
    paddingRight: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
  rightActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
});
