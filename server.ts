import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'smart-desk-ai-secret-key-2026';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- Seed Data ---
  async function seedDatabase() {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminEmail = 'arumugams7312@gmail.com'.toLowerCase();
    
    // Upsert admin user so it's always there
    console.log('Ensuring admin user exists:', adminEmail);
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        name: 'Arumugam Admin',
        role: 'ADMIN'
      },
      create: {
        name: 'Arumugam Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log('Admin user ready:', admin.email);

    const projectCount = await prisma.project.count();
    if (projectCount < 10) {
      console.log('Expanding database with 10 projects and many tasks...');
      
      // Clear existing to avoid duplicates if needed, or just add more
      // For a "real world" feel, let's just ensure we have exactly these 10
      await prisma.task.deleteMany({});
      await prisma.project.deleteMany({});
      await prisma.fAQ.deleteMany({});

      const projectsData = [
        { name: 'Website Redesign', description: 'Modernizing the company landing page and blog with a focus on conversion.' },
        { name: 'Mobile App Launch', description: 'Preparing for the iOS and Android release, including beta testing and marketing.' },
        { name: 'Q1 Marketing Campaign', description: 'Social media and email marketing push for the new year.' },
        { name: 'HR Portal Update', description: 'Internal tool for employee management and benefits tracking.' },
        { name: 'Customer Support Bot', description: 'Implementing an AI-driven chatbot for 24/7 customer assistance.' },
        { name: 'Data Migration 2026', description: 'Moving legacy data to the new cloud-native infrastructure.' },
        { name: 'Security Audit', description: 'Comprehensive review of all internal and external security protocols.' },
        { name: 'Product Roadmap Q3-Q4', description: 'Planning the next phase of feature development and releases.' },
        { name: 'Brand Identity Refresh', description: 'Updating logos, color palettes, and brand guidelines.' },
        { name: 'Community Outreach', description: 'Engaging with local tech communities and organizing workshops.' }
      ];

      for (const p of projectsData) {
        const project = await prisma.project.create({
          data: { ...p, userId: admin.id }
        });

        // Add 3-5 tasks per project
        await prisma.task.createMany({
          data: [
            { title: `Initial planning for ${p.name}`, status: 'DONE', projectId: project.id, userId: admin.id },
            { title: `Resource allocation for ${p.name}`, status: 'IN_PROGRESS', projectId: project.id, userId: admin.id },
            { title: `First milestone review of ${p.name}`, status: 'TODO', projectId: project.id, userId: admin.id },
            { title: `Stakeholder feedback for ${p.name}`, status: 'TODO', projectId: project.id, userId: admin.id },
          ]
        });
      }

      await prisma.fAQ.createMany({
        data: [
          { question: 'What is SmartDesk AI?', answer: 'SmartDesk AI is an all-in-one team productivity platform powered by advanced AI to automate project management and tasks.' },
          { question: 'How do I create a task using AI?', answer: 'Simply go to the AI Assistant tab and type something like "Create a task to fix the header in the Website project".' },
          { question: 'Can I manage multiple projects?', answer: 'Yes, you can create and manage as many projects as your team needs from the Projects tab.' },
          { question: 'Is my data secure?', answer: 'We use industry-standard encryption and secure JWT authentication to ensure your team data remains private.' },
          { question: 'How do integrations work?', answer: 'You can connect tools like Google Calendar and Slack from the Integrations page to sync your workflow.' },
          { question: 'Who can access the Knowledge Base?', answer: 'All team members can view the Knowledge Base, but only Admins can add or edit entries.' },
          { question: 'What AI model does SmartDesk use?', answer: 'We use the latest Gemini models from Google to provide high-quality reasoning and automation.' },
          { question: 'Can I export my tasks?', answer: 'Currently, tasks are managed within the platform, but CSV export features are on our roadmap.' },
          { question: 'How do I change my password?', answer: 'Navigate to the Settings page and select the Security tab to update your password.' },
          { question: 'Is there a mobile app?', answer: 'We are currently working on a mobile app! Check the "Mobile App Launch" project for status updates.' }
        ]
      });
      console.log('Seeding complete.');
    }
  }

  await seedDatabase();

  // --- Middleware ---
  const authenticate = async (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
    next();
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: role || 'MEMBER' }
      });
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      res.status(400).json({ error: 'User already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const trimmedEmail = email?.trim().toLowerCase();
    console.log('Login attempt for:', trimmedEmail);
    const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (!user) {
      console.log('User not found:', trimmedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for:', trimmedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.log('Login successful for:', trimmedEmail);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'none' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  });

  // --- Project Routes ---
  app.get('/api/projects', authenticate, async (req: any, res) => {
    const projects = await prisma.project.findMany({
      include: { tasks: true }
    });
    res.json(projects);
  });

  app.post('/api/projects', authenticate, async (req: any, res) => {
    const { name, description } = req.body;
    const project = await prisma.project.create({
      data: { name, description, userId: req.user.id }
    });
    res.json(project);
  });

  // --- Task Routes ---
  app.get('/api/tasks', authenticate, async (req: any, res) => {
    const tasks = await prisma.task.findMany({
      include: { project: true }
    });
    res.json(tasks);
  });

  app.post('/api/tasks', authenticate, async (req: any, res) => {
    const { title, description, projectId, status, dueDate } = req.body;
    const task = await prisma.task.create({
      data: { title, description, projectId, status: status || 'TODO', dueDate: dueDate ? new Date(dueDate) : null, userId: req.user.id }
    });
    res.json(task);
  });

  app.patch('/api/tasks/:id', authenticate, async (req, res) => {
    const { status } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(task);
  });

  // --- FAQ / Knowledge Base ---
  app.get('/api/faqs', authenticate, async (req, res) => {
    const faqs = await prisma.fAQ.findMany();
    res.json(faqs);
  });

  app.post('/api/faqs', authenticate, isAdmin, async (req, res) => {
    const { question, answer } = req.body;
    // In a real app, we'd generate embeddings here.
    // For this demo, we'll store a mock embedding or skip if not available.
    const faq = await prisma.fAQ.create({
      data: { question, answer }
    });
    res.json(faq);
  });

  // --- AI Assistant ---
  app.post('/api/ai/chat', authenticate, async (req: any, res) => {
    const { message } = req.body;
    
    const createTaskTool = {
      name: "create_task",
      parameters: {
        type: Type.OBJECT,
        description: "Create a new task in a project",
        properties: {
          title: { type: Type.STRING, description: "The title of the task" },
          project_name: { type: Type.STRING, description: "The name of the project to add the task to" },
          due_date: { type: Type.STRING, description: "The due date in YYYY-MM-DD format" },
        },
        required: ["title", "project_name"],
      },
    };

    try {
      let apiKey = process.env.GEMINI_API_KEY;
      const fallbackKey = 'AIzaSyDvUvLhGcslaH2RvBV0QoQbFPyRtLghees';
      
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        console.log('Using fallback Gemini API key provided by user.');
        apiKey = fallbackKey;
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'Gemini API key is missing. Please add GEMINI_API_KEY to your Secrets.' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const projects = await prisma.project.findMany();
      const context = `Current Projects: ${projects.map(p => p.name).join(', ')}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: message }] }],
        config: {
          systemInstruction: `You are SmartDesk AI, a professional team productivity assistant. 
          Context: ${context}
          Help users manage projects, tasks, and knowledge. Use the create_task tool when asked to create tasks.`,
          tools: [{ functionDeclarations: [createTaskTool] }],
        }
      });

      let aiResponseText = response.text || "";
      const functionCalls = response.functionCalls;

      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === "create_task") {
            const { title, project_name, due_date } = call.args as any;
            let project = await prisma.project.findFirst({ where: { name: project_name } });
            if (!project) {
              project = await prisma.project.create({ data: { name: project_name, userId: req.user.id } });
            }
            await prisma.task.create({
              data: {
                title,
                projectId: project.id,
                dueDate: due_date ? new Date(due_date) : null,
                userId: req.user.id
              }
            });
            aiResponseText += `\n\n✅ **Action Executed**: Created task "${title}" in project "${project_name}".`;
          }
        }
      }

      if (!aiResponseText && !functionCalls) {
        aiResponseText = "I understood your request but couldn't generate a specific response. How else can I help?";
      }

      await prisma.message.create({
        data: { userId: req.user.id, content: message, aiResponse: aiResponseText }
      });

      res.json({ text: aiResponseText });
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        return res.status(429).json({ error: 'AI Quota exceeded. Please try again in a few minutes or use a different API key.' });
      }
      res.status(500).json({ error: err.message || 'AI service is currently unavailable.' });
    }
  });

  // --- Knowledge Base Search ---
  app.get('/api/faqs/search', authenticate, async (req, res) => {
    const { q } = req.query;
    const faqs = await prisma.fAQ.findMany({
      where: {
        OR: [
          { question: { contains: String(q) } },
          { answer: { contains: String(q) } }
        ]
      }
    });
    res.json(faqs);
  });

  // --- Integrations (Real OAuth Structure) ---
  app.get('/api/auth/google/url', authenticate, (req, res) => {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
      client_id: process.env.GOOGLE_CLIENT_ID || 'MOCK_CLIENT_ID',
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/calendar.readonly'
      ].join(' '),
    };
    const qs = new URLSearchParams(options);
    res.json({ url: `${rootUrl}?${qs.toString()}` });
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const { code } = req.query;
    // In a real app: exchange code for tokens
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
          <div style="text-align: center; background: white; padding: 2rem; border-radius: 1rem; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #4f46e5;">Google Connected!</h2>
            <p style="color: #64748b;">You can close this window now.</p>
            <script>
              window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'google' }, '*');
              setTimeout(() => window.close(), 2000);
            </script>
          </div>
        </body>
      </html>
    `);
  });

  // --- Email Tools ---
  app.post('/api/ai/email', authenticate, async (req, res) => {
    const { content, action, tone } = req.body;
    // action: reply, rewrite, summarize
    // tone: formal, friendly, strict
    
    let prompt = "";
    if (action === 'reply') prompt = `Generate a ${tone} reply to this email: ${content}`;
    else if (action === 'rewrite') prompt = `Rewrite this email in a ${tone} tone: ${content}`;
    else if (action === 'summarize') prompt = `Summarize this email: ${content}`;

    try {
      let apiKey = process.env.GEMINI_API_KEY;
      const fallbackKey = 'AIzaSyDvUvLhGcslaH2RvBV0QoQbFPyRtLghees';

      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        apiKey = fallbackKey;
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'Gemini API key is missing.' });
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error('AI Processing Error:', err);
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        return res.status(429).json({ error: 'AI Quota exceeded. Please try again in a few minutes or use a different API key.' });
      }
      res.status(500).json({ error: 'AI processing failed' });
    }
  });

  // --- Integrations (Structure Only) ---
  app.get('/api/integrations/google/auth', authenticate, (req, res) => {
    res.json({ url: 'https://accounts.google.com/o/oauth2/v2/auth?client_id=MOCK_ID&redirect_uri=MOCK_URI' });
  });

  app.get('/api/integrations/slack/auth', authenticate, (req, res) => {
    res.json({ url: 'https://slack.com/oauth/v2/authorize?client_id=MOCK_ID&scope=commands,chat:write' });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
