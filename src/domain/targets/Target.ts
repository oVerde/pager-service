import { Alert } from "../models/Alert";

export interface Target {
  id: string;
  notify(alert: Alert): Promise<void>;
}
