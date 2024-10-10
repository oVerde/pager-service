export interface PersistenceService {
  saveService(serviceId: string, data: any): Promise<void>;
  loadService(serviceId: string): Promise<any>;
}
