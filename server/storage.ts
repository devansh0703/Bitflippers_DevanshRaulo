import { User, Patient, Report, EhrRecord, InsertUser, InsertPatient, InsertReport, InsertEhrRecord } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createPatient(patient: InsertPatient): Promise<Patient>;
  getPatient(id: number): Promise<Patient | undefined>;

  createReport(report: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsByParamedic(paramedicId: number): Promise<Report[]>;
  getReportsByPatient(patientId: number): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  updateReport(id: number, update: Partial<Report>): Promise<Report>;

  createEhrRecord(ehr: InsertEhrRecord): Promise<EhrRecord>;
  getEhrRecord(id: number): Promise<EhrRecord | undefined>;
  getEhrRecordsByPatient(patientId: number): Promise<EhrRecord[]>;

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private reports: Map<number, Report>;
  private ehrRecords: Map<number, EhrRecord>;
  private currentId: { [key: string]: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.reports = new Map();
    this.ehrRecords = new Map();
    this.currentId = { users: 1, patients: 1, reports: 1, ehrRecords: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId.patients++;
    const patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentId.reports++;
    const report = { ...insertReport, id };
    this.reports.set(id, report);
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByParamedic(paramedicId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.paramedicId === paramedicId
    );
  }

  async getReportsByPatient(patientId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.patientId === patientId
    );
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async updateReport(id: number, update: Partial<Report>): Promise<Report> {
    const report = this.reports.get(id);
    if (!report) throw new Error("Report not found");
    const updated = { ...report, ...update };
    this.reports.set(id, updated);
    return updated;
  }

  async createEhrRecord(insertEhr: InsertEhrRecord): Promise<EhrRecord> {
    const id = this.currentId.ehrRecords++;
    const ehr = { ...insertEhr, id };
    this.ehrRecords.set(id, ehr);
    return ehr;
  }

  async getEhrRecord(id: number): Promise<EhrRecord | undefined> {
    return this.ehrRecords.get(id);
  }

  async getEhrRecordsByPatient(patientId: number): Promise<EhrRecord[]> {
    return Array.from(this.ehrRecords.values()).filter(
      (record) => record.patientId === patientId
    );
  }
}

export const storage = new MemStorage();