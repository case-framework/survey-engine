# Survey Editor Event Listener Example

The SurveyEditor now supports a simple event-driven architecture with a single `survey-changed` event.

## Basic Usage

```typescript
import { SurveyEditor } from '../src/survey-editor';

// Create editor instance
const editor = new SurveyEditor(survey);

// Listen for any survey changes (both uncommitted changes and commits)
editor.on('survey-changed', (data) => {
  if (data.isCommit) {
    console.log('Changes committed:', data.description);
    // Save to persistent storage
    saveToDatabase(editor.toJson());
  } else {
    console.log('Survey modified (uncommitted)');
    // Auto-save to session storage for recovery
    updateSessionData(editor.toJson());
  }

  console.log('Has uncommitted changes:', data.hasUncommittedChanges);
});
```

## Session Data Auto-Save Example

```typescript
class EditorSession {
  private editor: SurveyEditor;
  private sessionKey: string;

  constructor(editor: SurveyEditor, sessionKey: string) {
    this.editor = editor;
    this.sessionKey = sessionKey;

    // Set up auto-save on any change
    this.editor.on('survey-changed', this.handleSurveyChanged.bind(this));
  }

  private handleSurveyChanged(data: { hasUncommittedChanges: boolean; isCommit: boolean; description?: string }) {
    if (data.isCommit) {
      // Save committed state to persistent storage
      localStorage.setItem(
        this.sessionKey,
        JSON.stringify(this.editor.toJson())
      );

      // Clear draft since it's now committed
      sessionStorage.removeItem(`${this.sessionKey}_draft`);
    } else if (data.hasUncommittedChanges) {
      // Save to session storage for recovery
      sessionStorage.setItem(
        `${this.sessionKey}_draft`,
        JSON.stringify(this.editor.toJson())
      );
    }
  }

  cleanup() {
    this.editor.clearAllListeners();
  }
}
```

## Analytics Example

```typescript
class EditorAnalytics {
  constructor(editor: SurveyEditor) {
    // Track all survey changes
    editor.on('survey-changed', (data) => {
      if (data.isCommit) {
        this.trackEvent('survey_changes_committed', {
          description: data.description,
          hasUncommittedChanges: data.hasUncommittedChanges
        });
      } else {
        this.trackEvent('survey_modified', {
          hasUncommittedChanges: data.hasUncommittedChanges
        });
      }
    });
  }

  private trackEvent(eventName: string, properties?: any) {
    // Send to your analytics service
    analytics.track(eventName, properties);
  }
}
```

## Available Events

| Event Type | Data | Description |
|------------|------|-------------|
| `survey-changed` | `{ hasUncommittedChanges: boolean; isCommit: boolean; description?: string }` | Fired when survey content changes or is committed |

### Event Data Properties

- `hasUncommittedChanges`: Whether the editor has uncommitted changes
- `isCommit`: `true` if this event was triggered by a commit, `false` if by a modification
- `description`: Only present when `isCommit` is `true`, contains the commit description

## Best Practices

1. **Remove listeners**: Always call `editor.off()` or `editor.clearAllListeners()` when cleaning up
2. **Error handling**: Event listeners are wrapped in try-catch, but handle errors gracefully
3. **Performance**: Be mindful of heavy operations in the `survey-changed` event as it fires on every modification
4. **Memory leaks**: Remove listeners when components unmount to prevent memory leaks
5. **Check event type**: Use the `isCommit` flag to differentiate between modifications and commits
