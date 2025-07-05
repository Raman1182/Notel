
# LearnLog: Your AI-Powered Study Companion

**Live Demo:** [Link to your Vercel deployment](https://learnlog-ai.vercel.app/)

---

## Overview

LearnLog is a modern, AI-enhanced productivity application designed to supercharge the learning process for students. It moves beyond simple note-taking, acting as an intelligent "second brain" that helps users organize, understand, and connect with their study material in a meaningful way. By integrating generative AI tools directly into the workflow, LearnLog transforms scattered notes into a structured, searchable, and interactive knowledge base.

This project was built to solve the common problems of disorganized study habits, information overload, and the difficulty of seeing the bigger picture across different subjects. It provides a centralized hub for focused work, task management, and AI-driven insights.

---

## Key Features

- **🧠 AI Study Buddy:** A conversational assistant that can explain complex concepts, answer questions, and provide study suggestions.
- **🌐 AI with Citations:** The AI assistant can search the web for up-to-date information and provides citations for its sources, ensuring academic integrity and verifiability.
- **🗺️ AI Mind Map Generation:** Instantly generate hierarchical mind maps from any topic to visualize connections and brainstorm ideas, with the option to add them directly to your notes.
- **⚡ AI-Powered Note Tools:** Summarize, expand, or explain any selected text within your notes with a single click.
- **🗂️ Intelligent Note-Taking:** A rich text editor integrated into a structured session system, allowing for organized notes under subjects, titles, and subheadings.
- **🔗 Smart Note Connections:** An AI flow that analyzes your current note and automatically suggests connections to relevant concepts in your past notes, revealing hidden relationships in your knowledge.
- **📝 AI-Generated Quizzes & Flashcards:** Turn any note into an interactive quiz (multiple-choice & open-ended) or a set of flashcards to test your knowledge and aid memorization.
- **🎯 Focused Study Sessions:** A robust session launcher with a built-in timer, including a **Pomodoro mode** (25/5 cycles) and a floating timer widget for distraction-free focus.
- **📊 Personalized Dashboard:** At-a-glance view of your study streak, upcoming deadlines, to-do list, saved links, and recent session analytics.
- **🔍 Smart Command Palette:** A `Cmd+K` interface for fast navigation, performing actions, and making AI queries from anywhere in the app.
- **🔒 Secure Authentication:** Full email/password and Google OAuth authentication flow handled by Firebase.

---

## Tech Stack & Architecture

This application is built with a modern, performant, and scalable tech stack, chosen to provide a best-in-class user experience and robust AI capabilities.

#### **Core Technologies**
- **Framework:** **Next.js 15 (App Router)**
- **Language:** **TypeScript**
- **UI:** **React**, **ShadCN UI**, **Tailwind CSS**
- **Authentication:** **Firebase Authentication**
- **Database:** **Firebase Firestore** (real-time, NoSQL)
- **AI & Backend Logic:** **Google AI (Gemini)** via **Genkit**
- **Deployment:** **Vercel**

#### **Architectural Highlights**
- **Server-First Approach:** Leverages Next.js Server Components and Server Actions to minimize client-side JavaScript, resulting in faster page loads and a snappier user experience.
- **Modular AI Flows with Genkit:** All generative AI features are encapsulated in self-contained Genkit "flows". This makes the AI logic structured, reusable, and easy to debug or extend. The integration with Zod ensures type-safe, structured data exchange with the AI models.
- **Real-time Data Sync:** Firestore provides real-time updates for notes, tasks, and deadlines, ensuring a seamless experience without manual refreshing. All data services are architected as server-side functions for security and efficiency.
- **Component-Driven UI:** The interface is built using ShadCN UI, providing a consistent, accessible, and themeable component library that accelerates development and ensures a high-quality, polished look and feel.

---

