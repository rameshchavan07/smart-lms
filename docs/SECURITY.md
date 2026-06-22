# SECURITY.md

# Smart LMS Security Policy

## Overview

This document defines security requirements for Smart LMS.

Goals:

- Protect User Accounts
- Protect Student Data
- Protect Teacher Data
- Protect Course Content
- Secure API Access
- Secure File Uploads
- Prevent Common Web Attacks

# Security Principles

The application must follow:

- Authentication
- Authorization
- Data Protection
- Input Validation
- Audit Logging
- Least Privilege Access

# Authentication Security

## Supported Login Methods

- Email + Password
- Google OAuth

## Password Requirements

Minimum Length:

8 Characters

Must Contain:

- Uppercase Letter
- Lowercase Letter
- Number

Recommended:

- Special Character

Example:

Valid:

Password123

Invalid:

password

## Password Storage

Passwords must never be stored in plain text.

Use:

bcrypt

Salt Rounds:

12

Example:

password ↓ bcrypt hash ↓ stored in database

# JWT Security

## Access Token

Expiration:

15 Minutes

Purpose:

API Access

## Refresh Token

Expiration:

7 Days

Purpose:

Generate New Access Tokens

Storage:

Database

## JWT Payload

Only store:

- userId
- email
- role

Never store:

- password
- personal information

# Authorization Security

## Role-Based Access Control

Roles:

ADMIN TEACHER STUDENT

## Access Rules

ADMIN

Full System Access

TEACHER

Only Assigned Courses

Only Assigned Students

Only Own Lectures

Only Own Assignments

STUDENT

Only Enrolled Courses

Only Own Assignments

Only Own Attendance

# Ownership Validation

Required:

User requests resource ↓ Verify ownership ↓ Allow or deny

Example:

Teacher A cannot edit Teacher B lecture.

Student A cannot access Student B submission.

# API Security

All API endpoints require:

Authentication Middleware

Authorization Middleware

Input Validation

# Rate Limiting

Required

Limit:

100 Requests / 15 Minutes

Per IP

Exceptions:

Login Routes

Stricter Limit:

10 Requests / 15 Minutes

# CORS Security

Allowed Origins:

Frontend Production URL

Example:

<https://smartlms.com>

Block:

Unknown Origins

# Input Validation

All request bodies must be validated.

Use:

Zod

Validate:

- Strings
- Emails
- Numbers
- UUIDs
- Dates

Reject Invalid Input

# SQL Injection Protection

Use:

Prisma ORM

Never use:

Raw SQL Queries

Unless absolutely necessary.

# XSS Protection

Prevent:

Cross Site Scripting

Methods:

- Escape User Input
- Sanitize HTML
- React Default Escaping

# CSRF Protection

If using cookies:

Enable CSRF Tokens

If using JWT Bearer Tokens:

Follow secure token practices.

# File Upload Security

## Allowed Types

Documents:

pdf

docx

pptx

zip

Videos:

mp4

mov

mkv

# File Validation

Check:

- File Type
- File Size
- File Extension

Before Upload

# Maximum File Size

Documents:

50 MB

Videos:

2 GB

# Malware Protection

Before storing files:

Validate File Type

Reject Executables

Blocked Types:

exe

bat

cmd

sh

apk

msi

dll

# Google Drive Security

Store:

driveFileId

fileUrl

fileName

Never Store:

Google Credentials In Code

Use Environment Variables

# Environment Variable Security

Store Secrets In:

.env

Never Commit:

.env

To GitHub

Required Variables

DATABASE_URL

JWT_SECRET

JWT_REFRESH_SECRET

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

GOOGLE_DRIVE_FOLDER_ID

# Logging Security

Log:

Authentication Events

Permission Errors

File Upload Events

Critical Actions

Do Not Log:

Passwords

JWT Tokens

Google Tokens

Personal Sensitive Data

# Audit Logging

Track:

User Login

User Logout

Course Creation

Course Deletion

Assignment Creation

Attendance Updates

Material Uploads

Recording Uploads

# Session Security

Logout Must:

Invalidate Refresh Token

Remove Active Session

# Brute Force Protection

Login Attempts

Maximum:

5 Failed Attempts

Lock Account:

15 Minutes

# Error Handling Security

Production Errors

Do Not Return:

Database Details

Stack Traces

Server Secrets

Example

Bad:

Database connection failed at host xyz

Good:

An unexpected error occurred

# HTTPS Security

Mandatory

All Traffic:

HTTPS Only

Redirect HTTP To HTTPS

# Security Headers

Use Helmet Middleware

Required Headers:

Content-Security-Policy

X-Frame-Options

X-Content-Type-Options

Referrer-Policy

# Backup Security

Database Backups

Encrypted

Daily

Retention:

30 Days

# Monitoring Security

Monitor:

Failed Logins

Suspicious Requests

Rate Limit Violations

Unauthorized Access Attempts

# Notification Security

Send Alerts For:

Multiple Failed Logins

Account Lockout

Role Changes

Critical System Actions

# Data Privacy Rules

Users Can Access:

Only Their Own Data

Teachers Can Access:

Assigned Students

Admins Can Access:

All Data

# Security Checklist

Password Hashing Enabled

JWT Enabled

Refresh Tokens Enabled

Role Validation Enabled

Ownership Validation Enabled

Input Validation Enabled

Rate Limiting Enabled

CORS Configured

HTTPS Enabled

File Validation Enabled

Audit Logs Enabled

Environment Variables Secured

Google Credentials Protected

Database Backups Enabled

Monitoring Enabled

Production Ready

# AI Development Rules

When generating code:

- Always use bcrypt.
- Always use JWT.
- Always validate input.
- Always check user role.
- Always check resource ownership.
- Never expose secrets.
- Never trust client-side validation.
- Never store passwords in plain text.
- Never allow unrestricted file uploads.
- Follow OWASP best practices.