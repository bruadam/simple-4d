/**
 * Main Application Screen with 4D Features
 *
 * This is the main entry point for the 4D BIM application.
 * It combines BIM viewer, 4D scheduling, and authentication.
 */

import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Platform, Text, TouchableOpacity } from 'react-native';
import { BIMViewer, PropertiesTable, Toolbar, AuthPanel } from '../src/components';
import { FourDPanel } from '../src/components/FourDPanel';
import { useBIM } from '../src/hooks/useBIM';
import { use4D } from '../src/hooks/use4D';
import { useAuth } from '../src/hooks/useAuth';
import type { EntityInfo } from '../src/modules/scheduling-4d';

export default function HomeScreen() {
  const [showAuth, setShowAuth] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentIFCModelId, setCurrentIFCModelId] = useState<string | null>(null);

  // BIM state
  const {
    isInitialized,
    isLoading: isBIMLoading,
    loadProgress,
    error: bimError,
    loadedModels,
    selectedElements,
    properties,
    initialize,
    loadIFCFromUrl,
    loadIFCFromFile,
    clearSelection,
    updateProperty,
    savePropertyChanges,
    hasUnsavedChanges,
  } = useBIM();

  // 4D state
  const {
    tasks,
    selectedTask,
    timelineState,
    taskLinks,
    taskRules,
    loadMSProjectFile,
    selectTask,
    linkEntitiesToTask,
    unlinkEntityFromTask,
    addLinkRule,
    removeLinkRule,
    playTimeline,
    pauseTimeline,
    resetTimeline,
    setCurrentDate,
    setPlaybackSpeed,
    saveToDatabase,
    loadFromDatabase,
    isLoading: is4DLoading,
    error: fourDError,
  } = use4D();

  // Auth state
  const { user, isLoading: isAuthLoading, signIn, signUp, signInWithMicrosoft, signOut } = useAuth();

  const handleContainerReady = useCallback(
    async (container: HTMLElement) => {
      await initialize(container);
    },
    [initialize]
  );

  const handleLoadFile = useCallback(
    (file: File) => {
      loadIFCFromFile(file);
    },
    [loadIFCFromFile]
  );

  const handleLoadUrl = useCallback(
    (url: string) => {
      loadIFCFromUrl(url);
    },
    [loadIFCFromUrl]
  );

  const handleLoadMSProject = useCallback(
    (file: File) => {
      loadMSProjectFile(file);
    },
    [loadMSProjectFile]
  );

  const handleLinkSelectedEntities = useCallback(() => {
    if (!selectedTask) return;

    // Convert selected elements to EntityInfo
    const entities: EntityInfo[] = selectedElements.map((elem) => ({
      globalId: `global_${elem.localId}`, // In real implementation, get from IFC properties
      expressId: elem.localId,
      type: elem.type || 'Unknown',
      name: elem.name,
    }));

    linkEntitiesToTask(selectedTask.taskId, entities);
  }, [selectedTask, selectedElements, linkEntitiesToTask]);

  const handleSaveProject = useCallback(async () => {
    if (!currentProjectId || !currentIFCModelId) {
      alert('Please set up project first');
      return;
    }

    try {
      await saveToDatabase(currentProjectId, currentIFCModelId);
      alert('Project saved successfully!');
    } catch (error) {
      alert('Failed to save project');
      console.error(error);
    }
  }, [currentProjectId, currentIFCModelId, saveToDatabase]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.unsupportedContainer}>
          <Text style={styles.unsupportedText}>
            This application is designed for web only.
          </Text>
          <Text style={styles.unsupportedSubtext}>
            Please access it through a web browser.
          </Text>
        </View>
      </View>
    );
  }

  const error = bimError || fourDError;

  return (
    <View style={styles.container}>
      {/* Toolbar */}
      <Toolbar
        loadedModels={loadedModels}
        isLoading={isBIMLoading || is4DLoading}
        loadProgress={loadProgress}
        onLoadFile={handleLoadFile}
        onLoadUrl={handleLoadUrl}
        onClearSelection={clearSelection}
        selectedCount={selectedElements.length}
      />

      {/* Additional controls */}
      <View style={styles.controlBar}>
        {user ? (
          <>
            <Text style={styles.userText}>
              Logged in as: {user.email}
            </Text>
            <TouchableOpacity style={styles.controlButton} onPress={handleSaveProject}>
              <Text style={styles.controlButtonText}>Save Project</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => signOut()}
            >
              <Text style={styles.controlButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowAuth(!showAuth)}
          >
            <Text style={styles.controlButtonText}>
              {showAuth ? 'Hide Login' : 'Login'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Auth Panel (if visible) */}
      {showAuth && !user && (
        <View style={styles.authOverlay}>
          <AuthPanel
            onSignIn={signIn}
            onSignUp={signUp}
            onSignInWithMicrosoft={signInWithMicrosoft}
            isLoading={isAuthLoading}
          />
        </View>
      )}

      {/* Main Content */}
      {!showAuth && (
        <View style={styles.mainContent}>
          {/* Left: BIM Viewer */}
          <View style={styles.viewerContainer}>
            <BIMViewer onContainerReady={handleContainerReady} />

            {/* Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Loading Overlay */}
            {!isInitialized && !error && (
              <View style={styles.loadingOverlay}>
                <Text style={styles.loadingText}>Initializing BIM Engine...</Text>
              </View>
            )}
          </View>

          {/* Middle: Properties Panel */}
          <View style={styles.propertiesPanel}>
            <PropertiesTable
              data={properties}
              onPropertyChange={updateProperty}
              onSave={savePropertyChanges}
              hasUnsavedChanges={hasUnsavedChanges}
            />
          </View>

          {/* Right: 4D Panel */}
          <View style={styles.fourDPanel}>
            <FourDPanel
              tasks={tasks}
              selectedTask={selectedTask}
              timelineState={timelineState}
              taskLinks={taskLinks}
              taskRules={taskRules}
              selectedEntitiesCount={selectedElements.length}
              onSelectTask={selectTask}
              onLinkSelectedEntities={handleLinkSelectedEntities}
              onUnlinkEntity={unlinkEntityFromTask}
              onAddRule={addLinkRule}
              onRemoveRule={removeLinkRule}
              onToggleRuleActive={(ruleId, isActive) => {
                // TODO: Implement toggle
              }}
              onPlay={playTimeline}
              onPause={pauseTimeline}
              onReset={resetTimeline}
              onDateChange={setCurrentDate}
              onSpeedChange={setPlaybackSpeed}
              onLoadMSProject={handleLoadMSProject}
            />
          </View>
        </View>
      )}

      {/* Footer */}
      {!showAuth && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            4D BIM Viewer • Click to select elements • Load MS Project XML for scheduling
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#16213e',
    borderBottomWidth: 1,
    borderBottomColor: '#2d3a5a',
    gap: 12,
  },
  userText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  controlButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  controlButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  authOverlay: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  viewerContainer: {
    flex: 1,
    position: 'relative',
  },
  propertiesPanel: {
    width: 300,
    backgroundColor: '#16213e',
    borderLeftWidth: 1,
    borderLeftColor: '#2d3a5a',
    padding: 12,
  },
  fourDPanel: {
    width: 400,
    backgroundColor: '#0f172a',
    borderLeftWidth: 1,
    borderLeftColor: '#1e293b',
  },
  errorContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 26, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64ffda',
    fontSize: 16,
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unsupportedText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  unsupportedSubtext: {
    color: '#8892b0',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: '#0f0f1a',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#2d3a5a',
  },
  footerText: {
    color: '#8892b0',
    fontSize: 12,
    textAlign: 'center',
  },
});
