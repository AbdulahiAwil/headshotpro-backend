import bcrypt from 'bcrypt';

export class PasswordService {
    private readonly SALT_ROUNDS = 12;


    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, this.SALT_ROUNDS);
    }

    // Compare password with hashed password
    async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(password, hashedPassword);
    }
}

export const passwordService = new PasswordService();
