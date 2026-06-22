# DEPLOYMENT.md

# Smart LMS Deployment Guide

## Overview

This document describes the deployment architecture for Smart LMS.

Technology Stack:

Frontend:

- React
- TypeScript
- Vite

Backend:

- Node.js
- Express.js
- TypeScript

Database:

- PostgreSQL

Storage:

- Google Drive API

Video Conferencing:

- Jitsi Meet

Authentication:

- JWT
- Google OAuth

# Production Architecture

Users ↓ Frontend (Vercel) ↓ Backend API (Railway / VPS) ↓ PostgreSQL Database ↓ Google Drive Storage ↓ Jitsi Meet

# Recommended Deployment Stack

## Frontend

Provider:

Vercel

Responsibilities:

- React Application
- Static Assets
- SPA Routing

Environment Variables:

VITE_API_URL

VITE_GOOGLE_CLIENT_ID

## Backend

Provider Options:

- Railway
- Render
- VPS (Recommended for Production)

Responsibilities:

- API Hosting
- Authentication
- Business Logic
- File Upload Processing

Environment Variables:

DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

GOOGLE_DRIVE_FOLDER_ID

PORT

NODE_ENV

## Database

Provider Options:

- PostgreSQL on Railway
- PostgreSQL on Supabase
- PostgreSQL on VPS

Recommended:

PostgreSQL

Requirements:

- Daily Backups
- SSL Enabled
- Connection Pooling

## Storage

Provider:

Google Drive

Purpose:

Store:

- Recorded Lectures
- Assignments
- Study Materials

Database stores:

- File ID
- File URL
- File Metadata

## Video Meetings

Provider:

Jitsi Meet

Meeting URLs generated dynamically.

Example:

<https://meet.jit.si/react-course-lecture-001>

# Environment Variables

## Frontend

.env.production

VITE_API_URL=<https://api.smartlms.com>

VITE_GOOGLE_CLIENT_ID=your_google_client_id

## Backend

.env

NODE_ENV=production

PORT=5000

DATABASE_URL=postgresql://username:password@host:5432/lms

JWT_SECRET=super_secret_key

JWT_REFRESH_SECRET=super_refresh_secret

GOOGLE_CLIENT_ID=your_google_client_id

GOOGLE_CLIENT_SECRET=your_google_client_secret

GOOGLE_DRIVE_FOLDER_ID=drive_folder_id

# Domain Structure

Frontend

<https://smartlms.com>

Backend

<https://api.smartlms.com>

Future:

Admin Portal

<https://admin.smartlms.com>

# SSL Requirements

Mandatory:

HTTPS

Valid SSL Certificate

Recommended:

Cloudflare SSL

# Frontend Deployment

## Build

npm install

npm run build

Generated Folder:

dist/

## Vercel Deployment

Build Command:

npm run build

Output Directory:

dist

Framework:

Vite

# Backend Deployment

## Build

npm install

npm run build

## Start

npm run start

# Prisma Deployment

## Generate Client

npx prisma generate

## Run Migrations

npx prisma migrate deploy

## Seed Database

npm run seed

# PostgreSQL Setup

Required Extensions:

uuid-ossp

Recommended Settings:

SSL Enabled

Automatic Backups Enabled

Connection Pooling Enabled

# File Upload Flow

Teacher Uploads File ↓ Backend Receives File ↓ Upload To Google Drive ↓ Store Metadata In PostgreSQL ↓ Delete Temporary File

Important:

Never store large files on server disk.

# CI/CD Pipeline

GitHub ↓ Push To Main ↓ GitHub Actions ↓ Build Project ↓ Run Tests ↓ Deploy

# GitHub Actions

Frontend Workflow

.github/workflows/frontend.yml

Tasks:

- Install Dependencies
- Build React App
- Deploy To Vercel

Backend Workflow

.github/workflows/backend.yml

Tasks:

- Install Dependencies
- Run Tests
- Generate Prisma Client
- Deploy Backend

# Logging Strategy

Production Logging

Use:

- Winston
- Pino

Log Types:

- Authentication
- API Errors
- Upload Events
- Database Errors

# Monitoring

Recommended:

- Uptime Monitoring
- Error Tracking
- API Monitoring

Tools:

- UptimeRobot
- Better Stack

# Backup Strategy

Database

Daily Backup

Retention:

30 Days

Google Drive

Files already stored remotely.

Metadata backed up in PostgreSQL.

# Security Deployment Rules

Mandatory:

- HTTPS Only
- Secure Cookies
- JWT Expiration
- Environment Variables
- Rate Limiting
- Input Validation
- CORS Protection

# Scaling Plan

Phase 1

100 - 500 Users

Vercel Railway PostgreSQL

Phase 2

500 - 5000 Users

VPS PostgreSQL Redis Cache

Phase 3

5000+ Users

Load Balancer Multiple Backend Instances Redis Dedicated Database Server

# Production Checklist

Frontend Deployed

Backend Deployed

Database Connected

Prisma Migration Executed

Google OAuth Configured

Google Drive Configured

Jitsi Integration Working

SSL Enabled

Backups Enabled

Monitoring Enabled

Error Logging Enabled

CI/CD Configured

Production Ready