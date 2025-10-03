import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {PageHeader} from '../components/PageHeader';
import {Step} from '../components/Step';
import {CircleCheckBig} from 'lucide-react-native';
import {colors, typography} from '../theme/tokens';

export const TaskDetail: React.FC = () => {
  return (
    <View style={styles.container}>
      <PageHeader title="Job Application" icon={CircleCheckBig} showBorderOnScroll={true} />
      <View style={styles.content}>
        <View style={styles.centeredContent}>
          <View style={styles.body}>
            <View style={styles.header}>
              <Text style={styles.title}>Job Application</Text>
              <Text style={styles.subtitle}>2 of 5 steps complete</Text>
            </View>
            <ScrollView style={styles.stepsList}>
              <Step
                title="Research Company Culture"
                description="Browse company website, LinkedIn, and Glassdoor to understand their values, mission, and work environment."
                completed={true}
              />
              <Step
                title="Tailor Resume"
                description="Customize your resume to highlight relevant skills and experiences that match the job description."
                completed={true}
              />
              <Step
                title="Write Cover Letter"
                description="Craft a personalized cover letter addressing why you're interested in this role and how your background aligns."
                completed={false}
                onSplit={() => console.log('Split step')}
              />
              <Step
                title="Prepare Application Materials"
                description="Gather and organize all required documents: resume, cover letter, portfolio samples, references, and transcripts."
                completed={false}
                onSplit={() => console.log('Split step')}
              />
              <Step
                title="Submit Application"
                description="Complete the online application form, upload all materials, and submit before the deadline."
                completed={false}
                onSplit={() => console.log('Split step')}
              />
            </ScrollView>
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
  },
  body: {
    maxWidth: 600,
    width: '100%',
    flex: 1,
  },
  header: {
    paddingTop: 52,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    color: colors.gray.light[950],
    fontSize: typography.heading.heading.fontSize,
    fontFamily: typography.heading.heading.fontFamily,
    fontWeight: String(typography.heading.heading.fontWeight) as any,
    lineHeight: typography.heading.heading.lineHeight,
  },
  subtitle: {
    color: colors.gray.light[600],
    fontSize: typography.body.base.fontSize,
    fontFamily: typography.body.base.fontFamily,
    fontWeight: String(typography.body.base.fontWeight) as any,
    lineHeight: typography.body.base.lineHeight,
  },
  stepsList: {
    flex: 1,
  },
});
