import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Report, InsertUser, InsertReport } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createReport(paramedicId: number, report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  updateReportTriage(id: number, assessment: { severity: string; explanation: string }): Promise<Report>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private currentUserId: number;
  private currentReportId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
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
}

export const storage = new MemStorage();
