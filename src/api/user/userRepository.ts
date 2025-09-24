import { User } from '@/common/entities/user.entity';
import AppDataSource from '@/configs/typeorm.config';

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async findAll(): Promise<User[]> {
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
  async findByEmailAsync(email: string | undefined): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }
  async createUserAsync(userData: Partial<User>): Promise<User> {
    const newUser = this.repo.create(userData);
    return this.repo.save(newUser);
  }
  async findByIdAsync(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id: id });
  }
  async updateUserAsync(id: string, updateData: Partial<User>): Promise<User | null> {
    await this.repo.update(id, updateData);
    return this.repo.findOneBy({ id });
  }
}
