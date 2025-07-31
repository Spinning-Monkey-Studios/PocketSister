import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertUserSchema, insertParentSchema, insertConversationSchema, insertMessageSchema } from "@shared/schema";
import { ChatService } from "./openai";
import { upload, processImage, saveFile, bufferToBase64 } from "./upload";
import bcrypt from "bcrypt";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize chat service
  const chatService = new ChatService();

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Middleware for API key checking
  const requireApiKey = async (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parent = await storage.getParentByEmail(user.parentEmail);
    if (!parent?.openaiApiKey && !parent?.geminiApiKey) {
      return res.status(403).json({ message: "AI API key not configured. Please ask your parent to set it up." });
    }

    // Configure AI provider based on available keys
    if (parent.openaiApiKey) {
      chatService.setProvider({ provider: 'openai', apiKey: parent.openaiApiKey });
    } else if (parent.geminiApiKey) {
      chatService.setProvider({ provider: 'gemini', apiKey: parent.geminiApiKey });
    }
    req.user = user;
    req.parent = parent;
    next();
  };

  // Blog posts endpoints
  app.get("/api/blog-posts", async (req, res) => {
    try {
      const category = req.query.category as string;
      const posts = category 
        ? await storage.getBlogPostsByCategory(category)
        : await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Testimonials endpoint
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch testimonials" });
    }
  });

  // Motivational messages endpoint
  app.get("/api/motivational-messages/random", async (req, res) => {
    try {
      const category = req.query.category as string;
      const message = await storage.getRandomMotivationalMessage(category);
      if (!message) {
        return res.status(404).json({ message: "No motivational message found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch motivational message" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(validatedData);
      res.status(201).json({ message: "Contact message sent successfully", id: message.id });
    } catch (error) {
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  // User registration
  app.post("/api/users/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }

      const user = await storage.createUser(validatedData);
      res.status(201).json({ user: { ...user, parentEmail: undefined } }); // Don't expose parent email
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Parent registration
  app.post("/api/parents/register", async (req, res) => {
    try {
      const { password, ...parentData } = insertParentSchema.parse(req.body);
      
      // Check if email already exists
      const existingParent = await storage.getParentByEmail(parentData.email);
      if (existingParent) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const parent = await storage.createParent({ ...parentData, password: hashedPassword });
      
      // Don't return password or API key
      const { password: _, openaiApiKey: __, ...safeParent } = parent;
      res.status(201).json({ parent: safeParent });
    } catch (error) {
      res.status(400).json({ message: "Invalid parent data" });
    }
  });

  // Parent login
  app.post("/api/parents/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const parent = await storage.getParentByEmail(email);
      if (!parent) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, parent.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateParentSettings(parent.id, { lastLoginAt: new Date() });

      // Don't return password
      const { password: _, ...safeParent } = parent;
      res.json({ parent: safeParent });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update parent settings (API key, restrictions, etc.)
  app.patch("/api/parents/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Hash password if being updated
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const parent = await storage.updateParentSettings(id, updates);
      const { password, ...safeParent } = parent;
      res.json({ parent: safeParent });
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Avatar generation endpoint
  app.post("/api/avatar/generate", requireApiKey, async (req: any, res) => {
    try {
      const { description } = req.body;
      const userId = req.user.id;

      if (!description?.trim()) {
        return res.status(400).json({ message: "Description is required" });
      }

      // Generate multiple avatar options using AI image generation
      const avatarPrompts = [
        `${description}, digital art style, friendly and approachable, clean background, safe for children`,
        `${description}, anime/manga style, cute and expressive, vibrant colors, child-friendly`,
        `${description}, cartoon style, fun and playful, bright lighting, appropriate for kids`,
        `${description}, realistic digital art, professional and polished, family-friendly`
      ];

      const avatars = [];
      
      // Try to generate real AI images if OpenAI API key is available
      if (process.env.OPENAI_API_KEY) {
        try {
          const { generateImage } = require('./openai');
          
          for (let i = 0; i < avatarPrompts.length; i++) {
            const prompt = avatarPrompts[i];
            try {
              const imageResult = await generateImage(prompt);
              avatars.push({
                id: `avatar_${Date.now()}_${i}`,
                imageUrl: imageResult.url,
                description: description,
                style: ['Digital Art', 'Anime', 'Cartoon', 'Realistic'][i]
              });
            } catch (error) {
              console.error(`Failed to generate avatar ${i}:`, error);
              // Fallback to placeholder
              avatars.push({
                id: `avatar_${Date.now()}_${i}`,
                imageUrl: `/api/placeholder/avatar/${encodeURIComponent(prompt)}`,
                description: description,
                style: ['Digital Art', 'Anime', 'Cartoon', 'Realistic'][i]
              });
            }
          }
        } catch (error) {
          console.error('OpenAI generation error:', error);
          // Fallback to placeholders for all
          for (let i = 0; i < avatarPrompts.length; i++) {
            const prompt = avatarPrompts[i];
            avatars.push({
              id: `avatar_${Date.now()}_${i}`,
              imageUrl: `/api/placeholder/avatar/${encodeURIComponent(prompt)}`,
              description: description,
              style: ['Digital Art', 'Anime', 'Cartoon', 'Realistic'][i]
            });
          }
        }
      } else {
        // Use placeholder images when no API key
        for (let i = 0; i < avatarPrompts.length; i++) {
          const prompt = avatarPrompts[i];
          avatars.push({
            id: `avatar_${Date.now()}_${i}`,
            imageUrl: `/api/placeholder/avatar/${encodeURIComponent(prompt)}`,
            description: description,
            style: ['Digital Art', 'Anime', 'Cartoon', 'Realistic'][i]
          });
        }
      }

      res.json({ avatars });
    } catch (error) {
      console.error("Avatar generation error:", error);
      res.status(500).json({ message: "Failed to generate avatars" });
    }
  });

  // Save avatar selection
  app.post("/api/avatar/save", requireApiKey, async (req: any, res) => {
    try {
      const { avatarId, name, imageUrl } = req.body;
      const userId = req.user.id;

      // Update user's avatar settings
      await storage.updateUser(userId, {
        avatarId,
        avatarName: name,
        avatarImageUrl: imageUrl
      });

      res.json({ success: true, message: "Avatar saved successfully" });
    } catch (error) {
      console.error("Avatar save error:", error);
      res.status(500).json({ message: "Failed to save avatar" });
    }
  });

  // Placeholder avatar image endpoint
  app.get("/api/placeholder/avatar/:prompt", (req, res) => {
    const prompt = decodeURIComponent(req.params.prompt);
    // Generate a simple SVG placeholder based on the prompt
    const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];
    const color = colors[Math.abs(prompt.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
    
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="${color}" opacity="0.1"/>
        <circle cx="100" cy="80" r="30" fill="${color}" opacity="0.7"/>
        <rect x="70" y="120" width="60" height="60" rx="10" fill="${color}" opacity="0.5"/>
        <text x="100" y="195" text-anchor="middle" font-family="Arial" font-size="12" fill="${color}">AI Avatar</text>
      </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  });

  // Voice synthesis endpoint (ElevenLabs integration)
  app.post("/api/voice/synthesize", requireApiKey, async (req: any, res) => {
    try {
      const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = req.body; // Default to Rachel voice
      
      if (!text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      // ElevenLabs integration (requires ELEVENLABS_API_KEY)
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5,
                style: 0.0,
                use_speaker_boost: true
              }
            })
          });

          if (response.ok) {
            const audioBuffer = await response.arrayBuffer();
            const audioBase64 = Buffer.from(audioBuffer).toString('base64');
            
            res.json({
              success: true,
              audioData: `data:audio/mpeg;base64,${audioBase64}`,
              message: "Voice synthesized successfully"
            });
          } else {
            throw new Error(`ElevenLabs API error: ${response.status}`);
          }
        } catch (error) {
          console.error("ElevenLabs synthesis error:", error);
          res.json({ 
            success: false, 
            message: "ElevenLabs synthesis failed, falling back to browser voice",
            fallback: true
          });
        }
      } else {
        res.json({ 
          success: false, 
          message: "ElevenLabs API key not configured, using browser voice",
          fallback: true
        });
      }
    } catch (error) {
      console.error("Voice synthesis error:", error);
      res.status(500).json({ message: "Failed to synthesize voice" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", requireApiKey, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { buffer, mimetype, originalname } = req.file;
      
      // Process image if it's an image file
      let processedData = { buffer, metadata: {} };
      if (mimetype.startsWith('image/')) {
        processedData = await processImage(buffer, mimetype);
      }

      // Save file
      const fileUrl = await saveFile(processedData.buffer, originalname, mimetype);
      
      res.json({
        success: true,
        fileUrl,
        metadata: processedData.metadata,
        originalName: originalname,
        mimeType: mimetype,
        size: buffer.length
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Chat endpoints
  app.post("/api/chat/send", requireApiKey, async (req: any, res) => {
    try {
      const { message, conversationId, fileUrl, fileName, fileMimeType } = req.body;
      const userId = req.user.id;

      // Get or create conversation
      let conversation;
      if (conversationId) {
        conversation = await storage.getConversationById(conversationId);
        if (!conversation || conversation.userId !== userId) {
          return res.status(404).json({ message: "Conversation not found" });
        }
      } else {
        conversation = await storage.createConversation({
          userId,
          title: message.substring(0, 50) + "...",
          mood: "neutral",
          topics: []
        });
      }

      // Get conversation history
      const messageHistory = await storage.getMessagesByConversation(conversation.id);
      const conversationHistory = messageHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Prepare image data if file is provided
      let imageData;
      if (fileUrl && fileMimeType?.startsWith('image/')) {
        try {
          const fs = require('fs');
          const path = require('path');
          const filePath = path.join(process.cwd(), fileUrl);
          const fileBuffer = fs.readFileSync(filePath);
          const base64 = bufferToBase64(fileBuffer);
          
          imageData = {
            base64,
            mimeType: fileMimeType,
            filename: fileName || 'uploaded_image'
          };
        } catch (error) {
          console.error("Error reading uploaded file:", error);
        }
      }

      // Generate AI response
      const aiResponse = await chatService.generateResponse(
        userId, 
        message || "What do you see in this image?", 
        conversationHistory, 
        imageData
      );

      // Save user message
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message || (fileUrl ? `[Shared ${fileName}]` : ''),
        metadata: { fileUrl, fileName, fileMimeType }
      });

      // Save AI response
      const aiMessage = await storage.createMessage({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse.content,
        metadata: aiResponse.metadata
      });

      // Update conversation
      await storage.updateConversation(conversation.id, {
        summary: `Last discussed: ${aiResponse.metadata.topics?.join(', ') || 'general chat'}`,
        mood: aiResponse.metadata.mood || conversation.mood,
        topics: aiResponse.metadata.topics || conversation.topics
      });

      // Update user activity
      await storage.updateUserActivity(userId);

      res.json({
        message: aiMessage,
        conversation: await storage.getConversationById(conversation.id)
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: error.message || "Failed to send message" });
    }
  });

  // Get user conversations
  app.get("/api/chat/conversations", requireApiKey, async (req: any, res) => {
    try {
      const conversations = await storage.getConversationsByUser(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation messages
  app.get("/api/chat/conversations/:id/messages", requireApiKey, async (req: any, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversationById(id);
      
      if (!conversation || conversation.userId !== req.user.id) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
