# Intelligent Collaborative Document Editor

> A real-time collaborative document platform that bridges the gap between Google Docs-style collaboration and Microsoft Word-style semantic document control.

## The Problem
Existing word-processing tools force users to compromise. Web-based editors excel at real-time collaboration but struggle with complex, academic document formatting. Traditional desktop processors offer immense layout control but treat collaboration as an afterthought. This fragmentation frustrates students, researchers, and professionals writing structured documents.

## The Solution
Write naturally. Collaborate seamlessly. Let the software handle the structure.

This platform treats documents as a **Semantic Abstract Syntax Tree (AST)** rather than flat HTML. By natively understanding the difference between a "Heading 1" and a "Figure Caption", the system can automate complex formatting while multiple users edit simultaneously.

## Core Features (MVP)
- **Real-Time Collaboration:** Conflict-free synchronized editing with presence and cursors.
- **Semantic Structure:** Native understanding of Headings, Paragraphs, Lists, Figures, and Tables.
- **Intelligent Automation:** Automatic numbering for multi-level headings and figures.
- **Professional Layout:** Configurable page sizes, margins, headers, and footers.
- **Portability:** Native DOCX and PDF export without vendor lock-in.

## System Architecture
The application is built on a modern, distributed architecture designed for real-time state synchronization:

- **Frontend:** React, TypeScript, Vite
- **Document Engine:** Tiptap (ProseMirror-based headless editor)
- **Collaboration Layer:** Yjs (CRDT - Conflict-free Replicated Data Type), WebSockets
- **Backend:** Python, FastAPI
- **Database:** PostgreSQL (Production) / SQLite (Local Dev)

## Project Tracking & Roadmap
To see our 8-week development roadmap and daily engineering log, please view [PROGRESS.md](PROGRESS.md).

## License
This project is licensed under the MIT License.