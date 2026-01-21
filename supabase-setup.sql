-- Supabase Database Setup for 4D BIM Application
--
-- This file contains the SQL commands to set up the database schema
-- Run these commands in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    task_id TEXT NOT NULL,
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    duration NUMERIC DEFAULT 0,
    percent_complete NUMERIC DEFAULT 0,
    predecessors TEXT[],
    resources TEXT[],
    notes TEXT,
    outline_level INTEGER DEFAULT 1,
    outline_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, task_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_outline_number ON tasks(outline_number);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks in their projects"
    ON tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their projects"
    ON tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks in their projects"
    ON tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks in their projects"
    ON tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = tasks.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================
-- IFC MODELS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ifc_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    file_url TEXT,
    file_hash TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ifc_models_project_id ON ifc_models(project_id);
CREATE INDEX IF NOT EXISTS idx_ifc_models_is_current ON ifc_models(is_current);

-- Enable Row Level Security
ALTER TABLE ifc_models ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ifc_models
CREATE POLICY "Users can view IFC models in their projects"
    ON ifc_models FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ifc_models.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create IFC models in their projects"
    ON ifc_models FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ifc_models.project_id
            AND projects.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

CREATE POLICY "Users can update IFC models in their projects"
    ON ifc_models FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ifc_models.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete IFC models in their projects"
    ON ifc_models FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = ifc_models.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================
-- TASK ENTITY LINKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS task_entity_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id TEXT NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    ifc_model_id UUID REFERENCES ifc_models(id) ON DELETE CASCADE NOT NULL,
    entity_global_id TEXT NOT NULL,
    entity_express_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL,
    entity_name TEXT,
    link_type TEXT CHECK (link_type IN ('manual', 'rule')) DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(task_id, project_id, entity_express_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_task_entity_links_task_id ON task_entity_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_entity_links_project_id ON task_entity_links(project_id);
CREATE INDEX IF NOT EXISTS idx_task_entity_links_ifc_model_id ON task_entity_links(ifc_model_id);
CREATE INDEX IF NOT EXISTS idx_task_entity_links_entity_global_id ON task_entity_links(entity_global_id);

-- Enable Row Level Security
ALTER TABLE task_entity_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_entity_links
CREATE POLICY "Users can view task links in their projects"
    ON task_entity_links FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = task_entity_links.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task links in their projects"
    ON task_entity_links FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = task_entity_links.project_id
            AND projects.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

CREATE POLICY "Users can update task links in their projects"
    ON task_entity_links FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = task_entity_links.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete task links in their projects"
    ON task_entity_links FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = task_entity_links.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================
-- LINK RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS link_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    task_id TEXT NOT NULL,
    rule_type TEXT CHECK (rule_type IN ('property_match', 'name_pattern', 'type_filter')) NOT NULL,
    rule_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_link_rules_project_id ON link_rules(project_id);
CREATE INDEX IF NOT EXISTS idx_link_rules_task_id ON link_rules(task_id);
CREATE INDEX IF NOT EXISTS idx_link_rules_is_active ON link_rules(is_active);

-- Enable Row Level Security
ALTER TABLE link_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for link_rules
CREATE POLICY "Users can view link rules in their projects"
    ON link_rules FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = link_rules.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create link rules in their projects"
    ON link_rules FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = link_rules.project_id
            AND projects.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

CREATE POLICY "Users can update link rules in their projects"
    ON link_rules FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = link_rules.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete link rules in their projects"
    ON link_rules FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = link_rules.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_rules_updated_at BEFORE UPDATE ON link_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
