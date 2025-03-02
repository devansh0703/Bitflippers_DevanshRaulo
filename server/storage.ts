import { IStorage } from "./storage";
import createMemoryStore from "memorystore";
import session from "express-session";
import { InsertUser, InsertPatient, InsertCase, User, Patient, Case } from "@shared/schema";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private patients: Map<number, Patient>;
  private cases: Map<number, Case>;
  sessionStore: session.SessionStore;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.patients = new Map();
    this.cases = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
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
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentId++;
    const patient: Patient = { ...insertPatient, id };
    this.patients.set(id, patient);
    return patient;
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = this.currentId++;
    const caseData: Case = { ...insertCase, id };
    this.cases.set(id, caseData);
    return caseData;
  }

  async getAllCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async updateCaseTriageResult(id: number, triageResult: string): Promise<Case> {
    const caseData = this.cases.get(id);
    if (!caseData) throw new Error("Case not found");
    
    const updated = { ...caseData, triageResult: JSON.parse(triageResult) };
    this.cases.set(id, updated);
    return updated;
  }

  async updateCaseTreatment(id: number, treatment: string): Promise<Case> {
    const caseData = this.cases.get(id);
    if (!caseData) throw new Error("Case not found");
    
    const updated = { ...caseData, treatmentRecommendation: treatment };
    this.cases.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
