import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
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
