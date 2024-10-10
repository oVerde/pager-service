export interface PersistenceAdapter {
  saveService(serviceId: string, data: any): Promise<void>;
  loadService(serviceId: string): Promise<any>;
}
