import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Report, Resource, InsertUser, InsertReport, InsertResource } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createReport(paramedicId: number, report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  updateReportTriage(id: number, assessment: { severity: string; explanation: string }): Promise<Report>;
  getResources(): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResourceStatus(id: number, status: string): Promise<Resource>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private resources: Map<number, Resource>;
  private currentUserId: number;
  private currentReportId: number;
  private currentResourceId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.resources = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.currentResourceId = 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });

    // Initialize some default resources
    this.initializeDefaultResources();
  }

  private async initializeDefaultResources() {
    const defaultResources = [
      { type: "ambulance", status: "available", details: { name: "Ambulance 1" }, location: { lat: 40.7128, lon: -74.0060 } },
      { type: "ambulance", status: "occupied", details: { name: "Ambulance 2" }, location: { lat: 40.7138, lon: -74.0070 } },
      { type: "bed", status: "available", details: { name: "Emergency Room 1" } },
      { type: "bed", status: "occupied", details: { name: "Emergency Room 2" } },
      { type: "staff", status: "available", details: { name: "Emergency Team A" } },
      { type: "staff", status: "occupied", details: { name: "Emergency Team B" } },
      { type: "supplies", status: "available", details: { name: "Emergency Kit 1" } },
      { type: "supplies", status: "maintenance", details: { name: "Emergency Kit 2" } },
    ];

    for (const resource of defaultResources) {
      await this.createResource(resource);
    }
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

  async createReport(paramedicId: number, insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = {
      ...insertReport,
      id,
      paramedicId,
      triageAssessment: null,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async getReportById(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async updateReportTriage(id: number, assessment: { severity: string; explanation: string }): Promise<Report> {
    const report = await this.getReportById(id);
    if (!report) throw new Error("Report not found");

    const updatedReport = { ...report, triageAssessment: assessment };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  async getResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentResourceId++;
    const resource: Resource = {
      ...insertResource,
      id,
      lastUpdated: new Date(),
    };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResourceStatus(id: number, status: string): Promise<Resource> {
    const resource = this.resources.get(id);
    if (!resource) throw new Error("Resource not found");

    const updatedResource = {
      ...resource,
      status,
      lastUpdated: new Date(),
    };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }
}

export const storage = new MemStorage();