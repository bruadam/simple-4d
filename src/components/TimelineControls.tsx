/**
 * Timeline Controls Component
 *
 * 4D visualization playback controls
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { TimelineState } from '../types/schedule';

interface TimelineControlsProps {
  timelineState: TimelineState;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onDateChange: (date: Date) => void;
  onSpeedChange: (speed: number) => void;
  style?: object;
}

export function TimelineControls({
  timelineState,
  onPlay,
  onPause,
  onReset,
  onDateChange,
  onSpeedChange,
  style,
}: TimelineControlsProps) {
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    // Update slider when current date changes
    const totalDuration =
      timelineState.endDate.getTime() - timelineState.startDate.getTime();
    const currentProgress =
      timelineState.currentDate.getTime() - timelineState.startDate.getTime();

    if (totalDuration > 0) {
      setSliderValue((currentProgress / totalDuration) * 100);
    }
  }, [timelineState.currentDate, timelineState.startDate, timelineState.endDate]);

  const handleSliderChange = (event: any) => {
    const value = parseFloat(event.target.value);
    setSliderValue(value);

    const totalDuration =
      timelineState.endDate.getTime() - timelineState.startDate.getTime();
    const newTime =
      timelineState.startDate.getTime() + (totalDuration * value) / 100;
    const newDate = new Date(newTime);

    onDateChange(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const speedOptions = [0.5, 1, 2, 5, 10];

  return (
    <View style={[styles.container, style]}>
      {/* Date Display */}
      <View style={styles.dateDisplay}>
        <Text style={styles.dateLabel}>Current Date:</Text>
        <Text style={styles.dateValue}>
          {formatDate(timelineState.currentDate)}
        </Text>
      </View>

      {/* Timeline Slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.dateSmall}>
          {formatDate(timelineState.startDate)}
        </Text>
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={sliderValue}
          onChange={handleSliderChange}
          style={{
            flex: 1,
            margin: '0 12px',
            cursor: 'pointer',
          }}
        />
        <Text style={styles.dateSmall}>
          {formatDate(timelineState.endDate)}
        </Text>
      </View>

      {/* Playback Controls */}
      <View style={styles.controlsRow}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onReset}
        >
          <Text style={styles.controlButtonText}>⏮ Reset</Text>
        </TouchableOpacity>

        {timelineState.isPlaying ? (
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={onPause}
          >
            <Text style={[styles.controlButtonText, styles.primaryButtonText]}>
              ⏸ Pause
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={onPlay}
          >
            <Text style={[styles.controlButtonText, styles.primaryButtonText]}>
              ▶ Play
            </Text>
          </TouchableOpacity>
        )}

        {/* Speed Control */}
        <View style={styles.speedControl}>
          <Text style={styles.speedLabel}>Speed:</Text>
          <View style={styles.speedButtons}>
            {speedOptions.map((speed) => (
              <TouchableOpacity
                key={speed}
                style={[
                  styles.speedButton,
                  timelineState.playbackSpeed === speed &&
                    styles.speedButtonActive,
                ]}
                onPress={() => onSpeedChange(speed)}
              >
                <Text
                  style={[
                    styles.speedButtonText,
                    timelineState.playbackSpeed === speed &&
                      styles.speedButtonTextActive,
                  ]}
                >
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Progress Info */}
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Progress: {sliderValue.toFixed(1)}%
        </Text>
        <Text style={styles.progressText}>
          Speed: {timelineState.playbackSpeed} days/sec
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 8,
  },
  dateValue: {
    color: '#64ffda',
    fontSize: 18,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateSmall: {
    color: '#94a3b8',
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  controlButton: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#475569',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  controlButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  speedControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speedLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginRight: 8,
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    backgroundColor: '#334155',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
  },
  speedButtonActive: {
    backgroundColor: '#64ffda',
    borderColor: '#64ffda',
  },
  speedButtonText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  speedButtonTextActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 12,
  },
});

export default TimelineControls;
