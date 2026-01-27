import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Pressable, TouchableOpacity, Linking, TextInput} from 'react-native';
import {createPortal} from 'react-dom';
import {Check, Circle, BetweenHorizontalStart, Clock, CheckCircle2, RefreshCw, Plus, Edit3, ExternalLink, BookOpen, StickyNote, Copy, Mail, ChevronDown, ChevronUp} from 'lucide-react-native';
import {Button} from './Button';
import {Tooltip} from './Tooltip';
import {colors, typography} from '../theme/tokens';
import type {StepMetadata, UserNoteStepMetadata, CopyDraftStepMetadata, CopyDraftValue} from '../types/backend';

interface StepProps {
  title: string;
  description?: string;
  timeEstimate?: string;
  completionCue?: string;
  completed?: boolean;
  metadata?: StepMetadata[];
  onToggle?: () => void;
  onSplit?: () => void;
  onRewrite?: () => void;
  onAddAfter?: () => void;
  onNoteChange?: (note: string) => void;
  isSplitting?: boolean;
  isRewriting?: boolean;
  isAddingAfter?: boolean;
  isEnriching?: boolean;
  isSavingNote?: boolean;
}

export const Step: React.FC<StepProps> = ({
  title,
  description,
  timeEstimate,
  completionCue,
  completed = false,
  metadata,
  onToggle,
  onSplit,
  onRewrite,
  onAddAfter,
  onNoteChange,
  isSplitting = false,
  isRewriting = false,
  isAddingAfter = false,
  isEnriching = false,
  isSavingNote = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSplitTooltip, setShowSplitTooltip] = useState(false);
  const [showRewriteTooltip, setShowRewriteTooltip] = useState(false);
  const [showAddAfterTooltip, setShowAddAfterTooltip] = useState(false);
  const [showNoteTooltip, setShowNoteTooltip] = useState(false);
  const [splitHovered, setSplitHovered] = useState(false);
  const [rewriteHovered, setRewriteHovered] = useState(false);
  const [addAfterHovered, setAddAfterHovered] = useState(false);
  const [noteHovered, setNoteHovered] = useState(false);
  const [splitTooltipPosition, setSplitTooltipPosition] = useState({x: 0, y: 0});
  const [rewriteTooltipPosition, setRewriteTooltipPosition] = useState({x: 0, y: 0});
  const [addAfterTooltipPosition, setAddAfterTooltipPosition] = useState({x: 0, y: 0});
  const [noteTooltipPosition, setNoteTooltipPosition] = useState({x: 0, y: 0});
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const splitButtonRef = useRef<any>(null);
  const rewriteButtonRef = useRef<any>(null);
  const addAfterButtonRef = useRef<any>(null);
  const noteButtonRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse description if it's a JSON array string
  const parseDescription = (desc?: string): string[] => {
    if (!desc) return [];
    try {
      const parsed = JSON.parse(desc);
      return Array.isArray(parsed) ? parsed : [desc];
    } catch {
      return [desc];
    }
  };

  const descriptionItems = parseDescription(description);

  // Find helpful links metadata
  const helpfulLinksMetadata = metadata?.find(m => m.field === 'helpful_links');
  const helpfulLinks = helpfulLinksMetadata?.value?.links || [];

  // Find user note metadata
  const userNoteMetadata = metadata?.find(
    (m): m is UserNoteStepMetadata => m.field === 'user_note'
  );
  const existingNote = userNoteMetadata?.value?.note || '';

  // Find copy draft metadata (singular)
  const copyDraftMetadata = metadata?.find(
    (m): m is CopyDraftStepMetadata => m.field === 'copy_draft'
  );
  const copyDraft = copyDraftMetadata?.value;
  const [isCopied, setIsCopied] = useState(false);
  const [isDraftExpanded, setIsDraftExpanded] = useState(false);

  // Handle copying draft content to clipboard
  const handleCopyDraft = async () => {
    if (!copyDraft) return;
    try {
      await navigator.clipboard.writeText(copyDraft.draft_content);
      setIsCopied(true);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Generate mailto link for email drafts - parse subject from content if present
  const generateMailtoLink = (draft: CopyDraftValue): string => {
    let subject = draft.draft_title;
    let body = draft.draft_content;

    // Try to extract subject from content if it starts with "Subject:"
    const subjectMatch = draft.draft_content.match(/^Subject:\s*(.+?)(?:\n|$)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
      body = draft.draft_content.replace(/^Subject:\s*.+?\n\n?/i, '');
    }

    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // Initialize note text from existing note
  useEffect(() => {
    setNoteText(existingNote);
  }, [existingNote]);

  // Auto-save with debouncing
  const debouncedSave = useCallback(
    (text: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        if (onNoteChange && text !== existingNote) {
          onNoteChange(text);
          setHasUnsavedChanges(false);
        }
      }, 1000);
    },
    [onNoteChange, existingNote]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleNoteChange = (text: string) => {
    setNoteText(text);
    setHasUnsavedChanges(text !== existingNote);
    debouncedSave(text);
  };

  const handleNoteClick = () => {
    setIsEditingNote(true);
  };

  // Update tooltip positions when buttons are hovered
  useEffect(() => {
    if (showSplitTooltip && splitButtonRef.current) {
      const rect = splitButtonRef.current.getBoundingClientRect();
      setSplitTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [showSplitTooltip]);

  useEffect(() => {
    if (showRewriteTooltip && rewriteButtonRef.current) {
      const rect = rewriteButtonRef.current.getBoundingClientRect();
      setRewriteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [showRewriteTooltip]);

  useEffect(() => {
    if (showAddAfterTooltip && addAfterButtonRef.current) {
      const rect = addAfterButtonRef.current.getBoundingClientRect();
      setAddAfterTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [showAddAfterTooltip]);

  useEffect(() => {
    if (showNoteTooltip && noteButtonRef.current) {
      const rect = noteButtonRef.current.getBoundingClientRect();
      setNoteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [showNoteTooltip]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.divider} />
      <View
        style={styles.container}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Pressable
              style={styles.iconContainer}
              onPress={onToggle}>
              {completed ? (
                <View style={styles.completedIcon}>
                  <Check size={12} color="white" strokeWidth={2} />
                </View>
              ) : (
                <Circle size={24} color={colors.gray.light[400]} strokeWidth={1.5} />
              )}
            </Pressable>
            <Text
              style={[
                styles.title,
                completed && styles.completedTitle,
              ]}>
              {title}
            </Text>
          </View>

          <View style={styles.metadataContainer}>
            {!completed && descriptionItems.length > 0 && (
              <>
                {descriptionItems.map((item, index) => (
                  <Text key={index} style={styles.metadataValue}>{item}</Text>
                ))}
              </>
            )}

            {/* Enriching indicator removed - global banner shows instead */}

            {/* Helpful Links */}
            {!completed && helpfulLinks.length > 0 && (
              <Text style={styles.helpfulLinksText}>
                Helpful links:{' '}
                {helpfulLinks.map((link, index) => (
                  <React.Fragment key={index}>
                    <Text
                      style={styles.helpfulLink}
                      onPress={() => Linking.openURL(link.url)}>
                      {link.title}
                    </Text>
                    {index < helpfulLinks.length - 1 && ', '}
                  </React.Fragment>
                ))}
              </Text>
            )}

            {!completed && timeEstimate && (
              <View style={styles.timeChip}>
                <Clock size={14} color={colors.gray.light[600]} strokeWidth={1.5} />
                <Text style={styles.timeChipText}>{timeEstimate}</Text>
              </View>
            )}
            {/* Completion cue hidden for now */}
            {/* {!completed && completionCue && (
              <View style={styles.metadataItem}>
                <CheckCircle2 size={18} color={colors.gray.light[950]} strokeWidth={1.12} />
                <Text style={styles.metadataValue}>{completionCue}</Text>
              </View>
            )} */}

            {/* User Note - Display or Edit */}
            {!completed && (isEditingNote || existingNote) && (
              <View style={styles.userNoteContainer}>
                <View style={styles.userNoteHeader}>
                  <StickyNote size={14} color={colors.amber[600]} strokeWidth={1.5} />
                  <Text style={styles.userNoteLabel}>Note</Text>
                  {isSavingNote && (
                    <ActivityIndicator size={10} color={colors.amber[600]} style={{marginLeft: 4}} />
                  )}
                  {hasUnsavedChanges && !isSavingNote && (
                    <Text style={styles.unsavedIndicator}>•</Text>
                  )}
                </View>
                {isEditingNote ? (
                  <TextInput
                    style={styles.userNoteInput}
                    value={noteText}
                    onChangeText={handleNoteChange}
                    placeholder="Add a note for future reference..."
                    placeholderTextColor={colors.gray.light[400]}
                    multiline
                    autoFocus
                    onBlur={() => {
                      if (!noteText.trim() && !existingNote) {
                        setIsEditingNote(false);
                      }
                    }}
                  />
                ) : (
                  <TouchableOpacity onPress={handleNoteClick}>
                    <Text style={styles.userNoteText}>{existingNote}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Copy Draft */}
            {!completed && copyDraft && (
              <View style={styles.copyDraftsContainer}>
                <View style={styles.copyDraftsHeader}>
                  <Copy size={14} color={colors.indigo[600]} strokeWidth={1.5} />
                  <Text style={styles.copyDraftsLabel}>Ready-to-use draft</Text>
                </View>
                <View style={styles.draftItem}>
                  <View style={styles.draftContent}>
                    <Text style={styles.draftTypeLabel}>
                      {copyDraft.draft_type === 'email' ? 'Email' : 'Text'}
                    </Text>
                    <Text style={styles.draftSubject}>{copyDraft.draft_title}</Text>
                    <Text
                      style={styles.draftBody}
                      numberOfLines={isDraftExpanded ? undefined : 3}
                    >
                      {copyDraft.draft_content}
                    </Text>
                    {copyDraft.customization_tips && (
                      <Text style={styles.draftTips}>
                        Tip: {copyDraft.customization_tips}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.draftExpandToggle}
                      onPress={() => setIsDraftExpanded(!isDraftExpanded)}
                    >
                      {isDraftExpanded ? (
                        <ChevronUp size={14} color={colors.indigo[600]} strokeWidth={1.5} />
                      ) : (
                        <ChevronDown size={14} color={colors.indigo[600]} strokeWidth={1.5} />
                      )}
                      <Text style={styles.draftExpandText}>
                        {isDraftExpanded ? 'Show less' : 'Show more'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.draftActions}>
                    <TouchableOpacity
                      style={[
                        styles.draftActionButton,
                        isCopied && styles.draftActionButtonCopied
                      ]}
                      onPress={handleCopyDraft}>
                      <Copy
                        size={16}
                        color={isCopied ? colors.success[600] : colors.indigo[600]}
                        strokeWidth={1.5}
                      />
                      {isCopied && (
                        <Text style={styles.copiedText}>Copied!</Text>
                      )}
                    </TouchableOpacity>
                    {copyDraft.draft_type === 'email' && (
                      <TouchableOpacity
                        style={styles.draftActionButton}
                        onPress={() => Linking.openURL(generateMailtoLink(copyDraft))}>
                        <Mail size={16} color={colors.indigo[600]} strokeWidth={1.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Actions Bar - appears on hover in top right */}
        {!completed && (isHovered || isSplitting || isRewriting || isAddingAfter || isSavingNote) && (onSplit || onRewrite || onAddAfter || onNoteChange) && (
          <View style={styles.actionsBar}>
            {isRewriting ? (
              <View style={styles.actionButton}>
                <ActivityIndicator size="small" color={colors.gray.light[600]} />
              </View>
            ) : onRewrite ? (
              <TouchableOpacity
                ref={rewriteButtonRef}
                style={[styles.actionButton, rewriteHovered && styles.actionButtonHovered]}
                onPress={onRewrite}
                onMouseEnter={() => {
                  setShowRewriteTooltip(true);
                  setRewriteHovered(true);
                }}
                onMouseLeave={() => {
                  setShowRewriteTooltip(false);
                  setRewriteHovered(false);
                }}
                disabled={isSplitting || isRewriting || isAddingAfter}>
                <Edit3
                  size={18}
                  color={colors.gray.light[600]}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ) : null}
            {isAddingAfter ? (
              <View style={styles.actionButton}>
                <ActivityIndicator size="small" color={colors.gray.light[600]} />
              </View>
            ) : onAddAfter ? (
              <TouchableOpacity
                ref={addAfterButtonRef}
                style={[styles.actionButton, addAfterHovered && styles.actionButtonHovered]}
                onPress={onAddAfter}
                onMouseEnter={() => {
                  setShowAddAfterTooltip(true);
                  setAddAfterHovered(true);
                }}
                onMouseLeave={() => {
                  setShowAddAfterTooltip(false);
                  setAddAfterHovered(false);
                }}
                disabled={isSplitting || isRewriting || isAddingAfter}>
                <Plus
                  size={18}
                  color={colors.gray.light[600]}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ) : null}
            {isSplitting ? (
              <View style={styles.actionButton}>
                <ActivityIndicator size="small" color={colors.gray.light[600]} />
              </View>
            ) : onSplit ? (
              <TouchableOpacity
                ref={splitButtonRef}
                style={[styles.actionButton, splitHovered && styles.actionButtonHovered]}
                onPress={onSplit}
                onMouseEnter={() => {
                  setShowSplitTooltip(true);
                  setSplitHovered(true);
                }}
                onMouseLeave={() => {
                  setShowSplitTooltip(false);
                  setSplitHovered(false);
                }}
                disabled={isSplitting || isRewriting || isAddingAfter}>
                <BetweenHorizontalStart
                  size={18}
                  color={colors.gray.light[600]}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ) : null}
            {onNoteChange && (
              <TouchableOpacity
                ref={noteButtonRef}
                style={[
                  styles.actionButton,
                  noteHovered && styles.actionButtonHovered,
                  (isEditingNote || existingNote) && styles.actionButtonActive,
                ]}
                onPress={handleNoteClick}
                onMouseEnter={() => {
                  setShowNoteTooltip(true);
                  setNoteHovered(true);
                }}
                onMouseLeave={() => {
                  setShowNoteTooltip(false);
                  setNoteHovered(false);
                }}
                disabled={isSplitting || isRewriting || isAddingAfter}>
                <StickyNote
                  size={18}
                  color={(isEditingNote || existingNote) ? colors.amber[600] : colors.gray.light[600]}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Portal tooltips to document body */}
      {showSplitTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: splitTooltipPosition.x,
          top: splitTooltipPosition.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>Split step</Text>
          </View>
        </div>,
        document.body
      )}

      {showRewriteTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: rewriteTooltipPosition.x,
          top: rewriteTooltipPosition.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>Rewrite step</Text>
          </View>
        </div>,
        document.body
      )}

      {showAddAfterTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: addAfterTooltipPosition.x,
          top: addAfterTooltipPosition.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>Add below</Text>
          </View>
        </div>,
        document.body
      )}

      {showNoteTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: noteTooltipPosition.x,
          top: noteTooltipPosition.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>{existingNote ? 'Edit note' : 'Add note'}</Text>
          </View>
        </div>,
        document.body
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    flexDirection: 'column',
    gap: 8,
    paddingTop: 20,
  },
  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    position: 'relative',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    position: 'relative',
    cursor: 'pointer',
    // @ts-ignore - web-specific styles
    userSelect: 'none',
    // @ts-ignore
    WebkitUserSelect: 'none',
  },
  completedIcon: {
    width: 24,
    height: 24,
    backgroundColor: colors.success[500],
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    color: colors.gray.light[950],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22.4,
  },
  metadataContainer: {
    flexDirection: 'column',
    gap: 8,
    paddingLeft: 32,
  },
  completedTitle: {
    color: colors.gray.light[400],
    fontWeight: '400',
    textDecorationLine: 'line-through',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.gray.light[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 40,
  },
  timeChipText: {
    color: colors.gray.light[600],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  actionsBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
    // @ts-ignore
    transition: 'background-color 0.15s ease',
  },
  actionButtonHovered: {
    backgroundColor: colors.gray.light[100],
  },
  actionButtonActive: {
    backgroundColor: colors.amber[50],
  },
  tooltipPortal: {
    backgroundColor: colors.gray.light[900],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 8,
  },
  tooltipText: {
    color: 'white',
    fontSize: typography.body.small.fontSize,
    fontFamily: typography.body.small.fontFamily,
    fontWeight: String(typography.body.small.fontWeight) as any,
    lineHeight: typography.body.small.lineHeight,
    // @ts-ignore
    whiteSpace: 'nowrap',
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.gray.light[300],
    borderRadius: 20,
  },
  metadataItem: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  descriptionItem: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 15,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray.light[600],
    marginTop: 6,
  },
  metadataValue: {
    flex: 1,
    color: colors.gray.light[600],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  helpfulLinksText: {
    color: colors.gray.light[600],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  helpfulLink: {
    color: colors.green[600],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
    textDecorationLine: 'underline',
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
  },
  enrichingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: colors.green[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 40,
  },
  enrichingChipText: {
    color: colors.green[600],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  userNoteContainer: {
    marginTop: 4,
    padding: 12,
    backgroundColor: colors.amber[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.amber[400],
    borderRadius: 6,
  },
  userNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  userNoteLabel: {
    color: colors.amber[700],
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unsavedIndicator: {
    color: colors.amber[500],
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
  },
  userNoteText: {
    color: colors.amber[900],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 20,
    // @ts-ignore - web-specific styles
    whiteSpace: 'pre-wrap',
  },
  userNoteInput: {
    color: colors.amber[900],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 20,
    padding: 0,
    margin: 0,
    minHeight: 60,
    // @ts-ignore - web-specific styles
    outline: 'none',
    backgroundColor: 'transparent',
    borderWidth: 0,
    // @ts-ignore
    resize: 'none',
  },
  // Copy Drafts styles
  copyDraftsContainer: {
    marginTop: 4,
    padding: 12,
    backgroundColor: colors.indigo[50],
    borderLeftWidth: 3,
    borderLeftColor: colors.indigo[400],
    borderRadius: 6,
  },
  copyDraftsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  copyDraftsLabel: {
    color: colors.indigo[700],
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.indigo[200],
  },
  draftContent: {
    flex: 1,
    marginRight: 12,
  },
  draftTypeLabel: {
    color: colors.indigo[500],
    fontSize: 11,
    fontFamily: 'Inter',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  draftSubject: {
    color: colors.indigo[900],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  draftBody: {
    color: colors.indigo[800],
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 18,
    // @ts-ignore - web-specific styles
    whiteSpace: 'pre-wrap',
  },
  draftTips: {
    color: colors.indigo[600],
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    fontStyle: 'italic',
    lineHeight: 16,
    marginTop: 8,
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftActionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: colors.indigo[100],
    flexDirection: 'row',
    gap: 4,
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
    // @ts-ignore
    transition: 'background-color 0.15s ease',
  },
  draftActionButtonCopied: {
    backgroundColor: colors.success[100],
    width: 'auto',
    paddingHorizontal: 8,
  },
  copiedText: {
    color: colors.success[600],
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  draftExpandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
  },
  draftExpandText: {
    color: colors.indigo[600],
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
  },
});
