# 4D BIM Viewer - Complete Guide

This application provides a comprehensive 4D BIM (Building Information Modeling) solution with scheduling capabilities, task-entity linking, and cloud persistence.

## Features

### 🏗️ Core BIM Features
- **IFC Model Loading**: Load and visualize IFC models in 3D
- **Element Selection**: Click to select building elements
- **Properties Viewing**: View and edit element properties
- **Multi-model Support**: Load multiple IFC models simultaneously

### 📅 4D Scheduling Features
- **MS Project XML Import**: Load construction schedules from Microsoft Project
- **Gantt Chart Visualization**: Interactive Gantt chart using jsGantt-improved
- **Timeline Playback**: Play, pause, and scrub through the construction timeline
- **Adjustable Speed**: Control playback speed (0.5x to 10x)
- **Visual Timeline**: See construction progress over time

### 🔗 Task-Entity Linking
- **Manual Linking**: Select IFC elements and link them to schedule tasks
- **Rule-Based Linking**: Create rules to automatically link entities
  - **Type Filter**: Link all entities of specific IFC types (e.g., IfcWall, IfcColumn)
  - **Name Pattern**: Link entities matching a regex pattern
  - **Property Match**: Link entities based on property values (planned)
- **Link Persistence**: Links are preserved across IFC model updates

### 💾 Data Persistence
- **Supabase Integration**: Cloud database for storing projects, schedules, and links
- **User Authentication**: Secure login with Supabase Auth
- **IFC Model Versioning**: Track model versions and maintain links across updates
- **Weekly Updates**: Support for weekly IFC model updates while preserving links

### 🎨 User Interface
- **Three-Panel Layout**:
  - Left: 3D BIM Viewer
  - Middle: Properties Panel
  - Right: 4D Scheduling Panel
- **Tabbed 4D Panel**:
  - Gantt Chart tab
  - Task Linking tab
- **Responsive Design**: Adapts to different screen sizes

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### Set Up Database Schema
1. Open the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase-setup.sql`
3. Run the SQL commands to create tables and policies

#### Configure Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run the Application

```bash
npm start
```

Then open in your web browser (web-only application).

## Usage Guide

### Loading an IFC Model

1. Click "Load IFC" in the toolbar
2. Either:
   - Select a local IFC file
   - Enter a URL to an IFC file

### Loading a Schedule (MS Project XML)

1. Go to the 4D Scheduling panel (right side)
2. Click "Load MS Project XML"
3. Select an MS Project XML export file
4. The Gantt chart will display the schedule

### Linking Entities to Tasks

#### Manual Linking
1. In the 4D panel, switch to the "Task Linking" tab
2. Select a task from the list
3. In the 3D viewer, select the IFC elements you want to link
4. Click "Link Selected (X)" button
5. The selected elements are now linked to the task

#### Rule-Based Linking
1. Select a task in the Task Linking tab
2. Click "+ Add Rule"
3. Choose rule type:
   - **Type Filter**: Enter IFC types separated by commas (e.g., `IfcWall, IfcColumn`)
   - **Name Pattern**: Enter a regex pattern (e.g., `^Wall.*` for all elements starting with "Wall")
4. Click "Add Rule"
5. The rule will automatically link matching entities

### Using the Timeline

1. Load both an IFC model and a schedule
2. Link entities to tasks
3. Go to the Gantt Chart tab
4. Use the timeline controls at the bottom:
   - **Play**: Start timeline animation
   - **Pause**: Pause the animation
   - **Reset**: Go back to the start date
   - **Slider**: Manually scrub through time
   - **Speed**: Adjust playback speed

The 3D viewer will update to show:
- **Gray/Transparent**: Tasks not yet started
- **Yellow**: Tasks in progress
- **Green**: Completed tasks

### Saving Your Work

1. Click "Login" in the top control bar
2. Sign in or create an account
3. After linking tasks and entities, click "Save Project"
4. Your schedule, links, and rules are saved to Supabase

### Loading a Saved Project

1. Sign in to your account
2. Click "Save Project" to save current work
3. The next time you load, use the same project ID to restore your work

## MS Project XML Export

To export a schedule from Microsoft Project:

1. Open your project in MS Project
2. Go to File → Save As
3. Choose "XML Format (*.xml)" as the file type
4. Save the file
5. Load this XML file in the 4D BIM Viewer

## Database Schema

### Tables

- **projects**: User projects
- **tasks**: Schedule tasks from MS Project
- **ifc_models**: IFC model versions
- **task_entity_links**: Links between tasks and IFC entities
- **link_rules**: Automated linking rules

All tables use Row Level Security (RLS) to ensure users can only access their own data.

## Architecture

### Frontend
- **React Native Web**: UI framework
- **Three.js**: 3D rendering
- **@thatopen/components**: BIM components
- **jsGantt-improved**: Gantt chart visualization
- **Supabase JS**: Database client

### Backend
- **Supabase**: Authentication and database
- **PostgreSQL**: Database with RLS policies

### Modules
- **bim-core**: Core BIM engine
- **ifc-loader**: IFC file loading
- **msproject-parser**: MS Project XML parsing
- **scheduling-4d**: 4D scheduling and visualization
- **selection**: Element selection
- **properties**: Property viewing/editing

## IFC Model Versioning

The system supports updating IFC models weekly while preserving task links:

1. **Global IDs**: Uses IFC Global IDs to track elements across versions
2. **Version Tracking**: Each IFC upload creates a new version
3. **Link Preservation**: Links reference global IDs, not just local IDs
4. **Current Version**: Only one version marked as "current" per project

When you upload a new IFC model:
1. The system registers it as a new version
2. Existing links are preserved using global IDs
3. If an element's global ID matches, the link is maintained
4. New elements can be linked to existing tasks

## Troubleshooting

### Supabase Connection Issues
- Check that environment variables are set correctly
- Verify your Supabase project is active
- Check browser console for errors

### IFC Loading Fails
- Ensure the IFC file is valid
- Try a smaller IFC file first
- Check browser console for errors

### MS Project XML Not Loading
- Ensure you exported as XML, not MPP
- Check the XML structure is valid
- Try a simpler project first

### Authentication Not Working
- Check Supabase Auth is enabled
- Verify environment variables
- Check email confirmation if required

## Future Enhancements

Potential improvements:
- Property-based linking rules
- Multiple project management UI
- IFC diff viewer for version comparison
- Custom task visualization styles
- Export reports and analytics
- Mobile support
- Collaborative features

## License

This project is part of the Simple 4D BIM application.

## Support

For issues or questions, please check:
- Browser console for errors
- Supabase dashboard for database issues
- Network tab for API failures
