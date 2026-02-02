import React, {useState, useRef, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Pressable, TouchableOpacity, Linking, TextInput} from 'react-native';
import {createPortal} from 'react-dom';
import {Check, Circle, BetweenHorizontalStart, Clock, CheckCircle2, RefreshCw, Plus, Edit3, ExternalLink, BookOpen, StickyNote, Copy, Send, ChevronDown, ChevronUp} from 'lucide-react-native';
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
  const [copyHovered, setCopyHovered] = useState(false);
  const [sendHovered, setSendHovered] = useState(false);
  const [showCopyTooltip, setShowCopyTooltip] = useState(false);
  const [showSendTooltip, setShowSendTooltip] = useState(false);
  const [copyTooltipPosition, setCopyTooltipPosition] = useState({x: 0, y: 0});
  const [sendTooltipPosition, setSendTooltipPosition] = useState({x: 0, y: 0});
  const copyButtonRef = useRef<any>(null);
  const sendButtonRef = useRef<any>(null);

  // Handle copying draft content to clipboard
  const handleCopyDraft = async () => {
    if (!copyDraft) return;
    try {
      await navigator.clipboard.writeText(copyDraft.draft_content);
      setIsCopied(true);
      setShowCopyTooltip(true);

      setTimeout(() => {
        setShowCopyTooltip(false);
      }, 1000);

      // Reset copied state after 4 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 4000);
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
        y: rect.bottom,
      });
    }
  }, [showSplitTooltip]);

  useEffect(() => {
    if (showRewriteTooltip && rewriteButtonRef.current) {
      const rect = rewriteButtonRef.current.getBoundingClientRect();
      setRewriteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    }
  }, [showRewriteTooltip]);

  useEffect(() => {
    if (showAddAfterTooltip && addAfterButtonRef.current) {
      const rect = addAfterButtonRef.current.getBoundingClientRect();
      setAddAfterTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    }
  }, [showAddAfterTooltip]);

  useEffect(() => {
    if (showNoteTooltip && noteButtonRef.current) {
      const rect = noteButtonRef.current.getBoundingClientRect();
      setNoteTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    }
  }, [showNoteTooltip]);

  useEffect(() => {
    if (showCopyTooltip && copyButtonRef.current) {
      const rect = copyButtonRef.current.getBoundingClientRect();
      setCopyTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    }
  }, [showCopyTooltip]);

  useEffect(() => {
    if (showSendTooltip && sendButtonRef.current) {
      const rect = sendButtonRef.current.getBoundingClientRect();
      setSendTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom,
      });
    }
  }, [showSendTooltip]);

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
                  <Text style={styles.copyDraftsLabel}>
                    {copyDraft.draft_type === 'email' ? 'Draft Email' : 'Draft Text'}
                  </Text>
                  <View style={styles.draftActions}>
                    <TouchableOpacity
                      ref={copyButtonRef}
                      style={[styles.draftActionButton, copyHovered && !isCopied && styles.draftActionButtonHovered, isCopied && styles.draftActionButtonCopied]}
                      onPress={handleCopyDraft}
                      onMouseEnter={() => { setCopyHovered(true); if (!isCopied) setShowCopyTooltip(true); }}
                      onMouseLeave={() => { setCopyHovered(false); if (!isCopied) setShowCopyTooltip(false); }}>
                      {isCopied ? (
                        <Check size={18} color={colors.success[600]} strokeWidth={1.5} />
                      ) : (
                        <Copy size={18} color={colors.gray.light[700]} strokeWidth={1.5} />
                      )}
                    </TouchableOpacity>
                    {copyDraft.draft_type === 'email' && (
                      <TouchableOpacity
                        ref={sendButtonRef}
                        style={[styles.draftActionButton, sendHovered && styles.draftActionButtonHovered]}
                        onPress={() => Linking.openURL(generateMailtoLink(copyDraft))}
                        onMouseEnter={() => { setSendHovered(true); setShowSendTooltip(true); }}
                        onMouseLeave={() => { setSendHovered(false); setShowSendTooltip(false); }}>
                        <Send size={18} color={colors.gray.light[700]} strokeWidth={1.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.draftDivider} />
                <Text style={styles.draftSubject}>{copyDraft.draft_title}</Text>
                <View style={styles.draftDivider} />
                <div
                  style={{
                    color: colors.gray.light[800],
                    fontSize: 16,
                    fontFamily: 'Inter',
                    fontWeight: 400,
                    lineHeight: '22.4px',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{__html: copyDraft.draft_content}}
                />
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
          transform: 'translate(-50%, 4px)',
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
          transform: 'translate(-50%, 4px)',
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
          transform: 'translate(-50%, 4px)',
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
          transform: 'translate(-50%, 4px)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>{existingNote ? 'Edit note' : 'Add note'}</Text>
          </View>
        </div>,
        document.body
      )}

      {showCopyTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: copyTooltipPosition.x,
          top: copyTooltipPosition.y,
          transform: 'translate(-50%, 4px)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>{isCopied ? 'Copied' : 'Copy'}</Text>
          </View>
        </div>,
        document.body
      )}

      {showSendTooltip && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: sendTooltipPosition.x,
          top: sendTooltipPosition.y,
          transform: 'translate(-50%, 4px)',
          zIndex: 10000,
          pointerEvents: 'none',
        }}>
          <View style={styles.tooltipPortal}>
            <Text style={styles.tooltipText}>Send</Text>
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
    gap: 20,
    paddingBottom: 20,
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
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  helpfulLinksText: {
    color: colors.gray.light[600],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  helpfulLink: {
    color: colors.green[600],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
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
    paddingTop: 12,
    paddingBottom: 20,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray.light[200],
    flexDirection: 'column',
    gap: 16,
  },
  copyDraftsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyDraftsLabel: {
    color: colors.gray.light[700],
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 19.6,
  },
  draftDivider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.gray.dark[200],
  },
  draftSubject: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    lineHeight: 22.4,
  },
  draftBody: {
    color: colors.gray.light[800],
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    lineHeight: 22.4,
    // @ts-ignore - web-specific styles
    whiteSpace: 'pre-wrap',
  },
  draftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  draftActionButton: {
    width: 32,
    height: 32,
    padding: 8,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    // @ts-ignore - web-specific styles
    cursor: 'pointer',
    // @ts-ignore
    transition: 'background-color 0.2s ease-in, color 0.2s ease-in',
  },
  draftActionButtonHovered: {
    backgroundColor: colors.gray.light[100],
  },
  draftActionButtonCopied: {
    backgroundColor: colors.success[50],
  },
});
