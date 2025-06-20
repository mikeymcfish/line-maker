import { 
  users, 
  images, 
  annotations,
  type User, 
  type InsertUser,
  type Image,
  type InsertImage,
  type Annotation,
  type InsertAnnotation
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Image methods
  createImage(image: InsertImage): Promise<Image>;
  getImages(): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  deleteImage(id: number): Promise<void>;
  
  // Annotation methods
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  getAnnotationsByImageId(imageId: number): Promise<Annotation[]>;
  deleteAnnotation(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private images: Map<number, Image>;
  private annotations: Map<number, Annotation>;
  private currentUserId: number;
  private currentImageId: number;
  private currentAnnotationId: number;

  constructor() {
    this.users = new Map();
    this.images = new Map();
    this.annotations = new Map();
    this.currentUserId = 1;
    this.currentImageId = 1;
    this.currentAnnotationId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const image: Image = { ...insertImage, id };
    this.images.set(id, image);
    return image;
  }

  async getImages(): Promise<Image[]> {
    return Array.from(this.images.values());
  }

  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async deleteImage(id: number): Promise<void> {
    this.images.delete(id);
    // Also delete related annotations
    const relatedAnnotations = Array.from(this.annotations.values())
      .filter(annotation => annotation.imageId === id);
    relatedAnnotations.forEach(annotation => {
      this.annotations.delete(annotation.id);
    });
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const id = this.currentAnnotationId++;
    const annotation: Annotation = { ...insertAnnotation, id };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async getAnnotationsByImageId(imageId: number): Promise<Annotation[]> {
    return Array.from(this.annotations.values())
      .filter(annotation => annotation.imageId === imageId);
  }

  async deleteAnnotation(id: number): Promise<void> {
    this.annotations.delete(id);
  }
}

export const storage = new MemStorage();
