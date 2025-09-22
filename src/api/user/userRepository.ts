import AppDataSource from '@/configs/typeorm.config';
import { User } from '@/common/entities/user.entity';

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async findAll(): Promise<User[]> {
    console.log('🚀 ~ UserRepository ~ findAll ~ return this.repo.find();:');
    return this.repo.find();
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async createUser(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
