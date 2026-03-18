# Restaurant Management System – Restro App

This is the main codebase for the restaurant management system, including:

- Dark-mode dashboards for **waiters**, **chefs**, and **managers**
- Real-time updates via Socket.IO
- Multi-database backend (PostgreSQL / MySQL / SQL Server / MongoDB)

Project layout mirrors the previous prototype:

- `client` – React + Vite frontend
- `server` – Express + TypeScript backend
- `db` – Example schemas for supported databases

 # Restaurant Management System

This repository contains a full-stack, real-time restaurant management system with role-based dashboards for **waiters**, **chefs**, and **managers**.

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Socket.IO client
- **Backend**: Node.js + Express + TypeScript, Socket.IO
- **Database**: SQL-based (PostgreSQL / MySQL / SQL Server) via a common query layer

## Project Structure

- `client` – React frontend (dark-mode dashboard UI)
- `server` – Express backend (REST + WebSocket APIs)
- `db` – Example SQL schemas and migration scripts for different databases

## Getting Started

See `server/README.md` and `client/README.md` for setup instructions.

