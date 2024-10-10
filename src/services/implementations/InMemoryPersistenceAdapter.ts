export class InMemoryPersistenceAdapter implements PersistenceService {
  private storage = new Map<string, any>();

  async saveService(serviceId: string, data: any): Promise<void> {
    this.storage.set(serviceId, data);
  }

  async loadService(serviceId: string): Promise<any> {
    return this.storage.get(serviceId) || null;
  }
}
