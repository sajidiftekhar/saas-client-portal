# Agency Client Portal (Multi-Tenant SaaS) --- Supabase Portfolio Project

## Overview

This project is a **multi-tenant client portal SaaS** where agencies
collaborate with their clients.\
Agencies can manage projects, assign tasks, share files, and communicate
with clients in realtime.

The goal is to demonstrate strong understanding of:

-   Supabase Authentication
-   PostgreSQL schema design
-   Row-Level Security (RLS)
-   Realtime subscriptions
-   File storage
-   Edge Functions
-   Multi-tenant architecture

This project should be built within **7 days** and be polished enough to
present to potential clients.

------------------------------------------------------------------------

# Core Concept

Agencies often need a portal where clients can:

-   Track project progress
-   Upload and download documents
-   Communicate with the agency
-   View tasks and deadlines

This application provides exactly that.

Each **organization (agency)** has isolated data.\
Users only see data belonging to their organization.

Example:

  Organization   Users   Projects
  -------------- ------- ----------
  Agency A       5       10
  Agency B       3       4

Row-Level Security ensures Agency A cannot access Agency B data.

------------------------------------------------------------------------

# Tech Stack

## Frontend

-   Next.js 14 (App Router)
-   TypeScript
-   TailwindCSS
-   Shadcn UI
-   TanStack Query

## Backend

-   Supabase

Supabase components used:

-   Supabase Auth
-   Supabase PostgreSQL
-   Supabase Realtime
-   Supabase Storage
-   Supabase Edge Functions
-   Row-Level Security (RLS)

## Deployment

Frontend: - Vercel

Backend: - Supabase Cloud

------------------------------------------------------------------------

# User Roles

Three roles exist within an organization.

  Role          Description
  ------------- -----------------------
  Owner         Agency owner
  Team Member   Internal agency staff
  Client        External client

## Permissions

  Feature           Owner   Team   Client
  ----------------- ------- ------ --------
  Manage users      Yes     No     No
  Create projects   Yes     Yes    No
  Create tasks      Yes     Yes    No
  View tasks        Yes     Yes    Yes
  Upload files      Yes     Yes    Yes
  Chat              Yes     Yes    Yes

------------------------------------------------------------------------

# Application Pages

## Landing Page

Simple SaaS marketing page.

Sections:

-   Product overview
-   Feature list
-   Login button
-   Signup button

Purpose: Make the project feel like a real product.

------------------------------------------------------------------------

# Authentication

Uses **Supabase Auth**.

Supported login methods:

-   Magic link
-   Email/password
-   Google OAuth

## Signup Flow

1.  User signs up
2.  System creates organization
3.  User becomes **Owner**
4.  Redirect to dashboard

## Login Flow

1.  User logs in
2.  Session established via Supabase
3.  Redirect to dashboard

------------------------------------------------------------------------

# Dashboard

The main overview screen.

Displays:

-   List of projects
-   Recent tasks
-   Recent messages
-   Recent files

Widgets:

-   Total projects
-   Tasks due today
-   Files uploaded
-   Recent activity

Purpose: Provide a quick overview of the organization's work.

------------------------------------------------------------------------

# Organization Management

Owners can manage members.

Features:

-   Invite users via email
-   Assign roles
-   Remove users

## Invite Flow

1.  Owner enters email
2.  System sends invite link
3.  User joins organization

------------------------------------------------------------------------

# Projects

Projects represent client engagements.

Examples:

-   Website redesign
-   Mobile app development
-   Marketing campaign

Each project contains:

-   tasks
-   chat
-   files
-   activity feed

Fields:

-   name
-   description
-   status
-   due date
-   created_by

------------------------------------------------------------------------

# Tasks

Tasks represent individual work items.

Fields:

-   title
-   description
-   status
-   priority
-   assigned_to
-   due_date

Task statuses:

-   todo
-   in_progress
-   review
-   done

Views:

-   list view
-   kanban board

Users can:

-   create tasks
-   assign tasks
-   change status
-   comment

------------------------------------------------------------------------

# Realtime Chat

Each project includes a chat room.

Users can:

-   send messages
-   attach files
-   view message history

Realtime functionality uses **Supabase Realtime subscriptions**.

When a message is sent:

1.  Message inserted into database
2.  All connected clients receive update instantly

------------------------------------------------------------------------

# File Storage

Files are attached to projects.

Examples:

-   design files
-   documents
-   contracts
-   screenshots

Files stored using **Supabase Storage**.

Features:

-   upload
-   download
-   preview
-   delete

Access is restricted using **RLS policies**.

------------------------------------------------------------------------

# Notifications

Implemented using **Supabase Edge Functions**.

Examples:

-   task assigned
-   user invited
-   new message

Edge functions may trigger:

-   email notification
-   webhook events

------------------------------------------------------------------------

# Activity Feed

Shows recent system events.

Examples:

-   task created
-   task updated
-   file uploaded
-   message sent

Helps clients track project progress.

------------------------------------------------------------------------

# Database Schema

## organizations

Columns:

-   id
-   name
-   created_at
-   owner_id

------------------------------------------------------------------------

## organization_members

Columns:

-   id
-   organization_id
-   user_id
-   role
-   created_at

------------------------------------------------------------------------

## projects

Columns:

-   id
-   organization_id
-   name
-   description
-   status
-   created_by
-   created_at

------------------------------------------------------------------------

## tasks

Columns:

-   id
-   project_id
-   title
-   description
-   status
-   assigned_to
-   priority
-   due_date
-   created_at

------------------------------------------------------------------------

## messages

Columns:

-   id
-   project_id
-   user_id
-   content
-   created_at

------------------------------------------------------------------------

## files

Columns:

-   id
-   project_id
-   uploaded_by
-   file_path
-   file_name
-   created_at

------------------------------------------------------------------------

# Row-Level Security Strategy

All tables enforce organization isolation.

Users can only access rows where they belong to the same organization.

Example logic:

User must exist in organization_members table where:

user_id = auth.uid()

This ensures strict tenant isolation.

------------------------------------------------------------------------

# Storage Buckets

Create storage bucket:

project-files

File path pattern:

organization_id/project_id/file_name

Example:

org123/project456/design.pdf

Only users belonging to the organization can access files.

------------------------------------------------------------------------

# Edge Functions

Edge functions demonstrate server-side logic.

Example use cases:

Send email when:

-   task assigned
-   user invited

Webhook endpoint example:

/api/project-created

Triggered when a project is created.

------------------------------------------------------------------------

# UI Components

Use professional UI components for polish.

Suggested elements:

-   sidebar navigation
-   dashboard widgets
-   project cards
-   kanban task board
-   chat interface
-   file list

Shadcn UI helps implement these quickly.

------------------------------------------------------------------------

# Demo Data

Seed demo data for presentation.

Example dataset:

1 organization\
3 users\
3 projects\
10 tasks\
5 files\
Chat history

This allows clients to explore the system instantly.

------------------------------------------------------------------------

# Deployment

Frontend:

Deploy using **Vercel**.

Backend:

Supabase hosted project.

------------------------------------------------------------------------

# GitHub Repository Structure

/app\
/components\
/lib/supabase\
/hooks\
/types\
/utils

README should explain:

-   architecture
-   database schema
-   RLS strategy
-   Supabase features used

------------------------------------------------------------------------

# Demo Credentials

Example accounts:

Owner\
owner@demo.com

Client\
client@demo.com

------------------------------------------------------------------------

# Optional Enhancements

If time allows:

-   drag-and-drop kanban
-   project progress charts
-   notifications UI
-   file previews
-   dark mode

------------------------------------------------------------------------

# What This Project Demonstrates

This project showcases:

-   multi-tenant SaaS architecture
-   secure data isolation
-   realtime collaboration
-   file management
-   event-driven backend logic

These are common requirements in real-world SaaS systems.

------------------------------------------------------------------------

# Goal

Create a portfolio project that looks like a **real SaaS product**, not
a simple demo.

The final result should be something you can confidently show to
potential clients.
