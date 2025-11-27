import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Pressable, TouchableOpacity, Linking} from 'react-native';
import {createPortal} from 'react-dom';
import {Check, Circle, BetweenHorizontalStart, Clock, CheckCircle2, RefreshCw, Plus, Edit3, ExternalLink, BookOpen} from 'lucide-react-native';
import {Button} from './Button';
import {Tooltip} from './Tooltip';
import {colors, typography} from '../theme/tokens';
import type {StepMetadata} from '../types/backend';

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
  isSplitting?: boolean;
  isRewriting?: boolean;
  isAddingAfter?: boolean;
  isEnriching?: boolean;
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
  isSplitting = false,
  isRewriting = false,
  isAddingAfter = false,
  isEnriching = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSplitTooltip, setShowSplitTooltip] = useState(false);
  const [showRewriteTooltip, setShowRewriteTooltip] = useState(false);
  const [showAddAfterTooltip, setShowAddAfterTooltip] = useState(false);
  const [splitHovered, setSplitHovered] = useState(false);
  const [rewriteHovered, setRewriteHovered] = useState(false);
  const [addAfterHovered, setAddAfterHovered] = useState(false);
  const [splitTooltipPosition, setSplitTooltipPosition] = useState({x: 0, y: 0});
  const [rewriteTooltipPosition, setRewriteTooltipPosition] = useState({x: 0, y: 0});
  const [addAfterTooltipPosition, setAddAfterTooltipPosition] = useState({x: 0, y: 0});
  const splitButtonRef = useRef<any>(null);
  const rewriteButtonRef = useRef<any>(null);
  const addAfterButtonRef = useRef<any>(null);

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

            {/* Enriching Chip */}
            {!completed && isEnriching && (
              <View style={styles.enrichingChip}>
                <ActivityIndicator size={12} color={colors.green[600]} />
                <Text style={styles.enrichingChipText}>Finding helpful links</Text>
              </View>
            )}

            {/* Helpful Links */}
            {!completed && !isEnriching && helpfulLinks.length > 0 && (
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
          </View>
        </View>

        {/* Actions Bar - appears on hover in top right */}
        {!completed && (isHovered || isSplitting || isRewriting || isAddingAfter) && (onSplit || onRewrite || onAddAfter) && (
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
});
