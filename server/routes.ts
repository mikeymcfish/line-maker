import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import sharp from "sharp";
import type { Image } from "@shared/schema";
import { insertImageSchema, insertAnnotationSchema } from "@shared/schema";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload images endpoint
  app.post("/api/images/upload", upload.array('images'), async (req, res) => {
    try {
      console.log(`Upload request received with ${req.files ? req.files.length : 0} files`);
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        console.log('No files found in request');
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedImages = [];

      for (const file of files) {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'images');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Move file to permanent location
        const filename = file.originalname;
        const permanentPath = path.join(uploadsDir, filename);
        await fs.rename(file.path, permanentPath);

        // Store image metadata
        const imageData = {
          filename,
          originalPath: permanentPath,
          size: file.size,
          width: null,
          height: null,
        };

        const validatedData = insertImageSchema.parse(imageData);
        const image = await storage.createImage(validatedData);
        uploadedImages.push(image);
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error("Error uploading images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Load images from folder path endpoint
  app.post('/api/images/load-folder', async (req, res) => {
    try {
      const { folderPath } = req.body;
      
      if (!folderPath) {
        return res.status(400).json({ error: 'Folder path is required' });
      }

      // Check if folder exists
      if (!fsSync.existsSync(folderPath)) {
        return res.status(400).json({ error: 'Folder does not exist' });
      }

      // Read directory and filter image files
      const files = fsSync.readdirSync(folderPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const imageFiles = files.filter((file: string) => 
        imageExtensions.includes(path.extname(file).toLowerCase())
      );

      if (imageFiles.length === 0) {
        return res.status(400).json({ error: 'No image files found in folder' });
      }

      const uploadedImages: Image[] = [];

      for (const filename of imageFiles) {
        const fullPath = path.join(folderPath, filename);
        const stats = fsSync.statSync(fullPath);
        
        // Copy file to uploads directory
        const uploadsDir = './uploads/images';
        if (!fsSync.existsSync(uploadsDir)) {
          fsSync.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const destPath = path.join(uploadsDir, filename);
        fsSync.copyFileSync(fullPath, destPath);

        // Get image dimensions
        let width: number | null = null;
        let height: number | null = null;
        
        try {
          const dimensions = await sharp(destPath).metadata();
          width = dimensions.width || null;
          height = dimensions.height || null;
        } catch (error) {
          console.warn('Could not get image dimensions:', error);
        }

        const image = await storage.createImage({
          filename,
          originalPath: destPath,
          size: stats.size,
          width,
          height,
        });
        
        uploadedImages.push(image);
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error('Error loading folder:', error);
      res.status(500).json({ error: 'Failed to load folder' });
    }
  });

  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      res.json({ images });
    } catch (error) {
      console.error("Error fetching images:", error);
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Serve uploaded images
  app.get("/api/images/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const imagePath = path.join(process.cwd(), 'uploads', 'images', filename);
      
      // Check if file exists
      try {
        await fs.access(imagePath);
        res.sendFile(path.resolve(imagePath));
      } catch {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // Save annotation
  app.post("/api/annotations", async (req, res) => {
    try {
      const { imageId, filename, canvasData } = req.body;

      if (!imageId || !filename || !canvasData) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create net directory if it doesn't exist
      const netDir = path.join(process.cwd(), 'uploads', 'net');
      await fs.mkdir(netDir, { recursive: true });

      // Convert base64 canvas data to PNG file
      const base64Data = canvasData.replace(/^data:image\/png;base64,/, '');
      const savedPath = path.join(netDir, filename);
      
      await fs.writeFile(savedPath, base64Data, 'base64');

      // Store annotation metadata
      const annotationData = {
        imageId: parseInt(imageId),
        filename,
        savedPath,
      };

      const validatedData = insertAnnotationSchema.parse(annotationData);
      const annotation = await storage.createAnnotation(validatedData);

      res.json({ annotation });
    } catch (error) {
      console.error("Error saving annotation:", error);
      res.status(500).json({ message: "Failed to save annotation" });
    }
  });

  // Get annotations for an image
  app.get("/api/annotations/:imageId", async (req, res) => {
    try {
      const imageId = parseInt(req.params.imageId);
      const annotations = await storage.getAnnotationsByImageId(imageId);
      res.json({ annotations });
    } catch (error) {
      console.error("Error fetching annotations:", error);
      res.status(500).json({ message: "Failed to fetch annotations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
