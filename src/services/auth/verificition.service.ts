import crypto from "crypto";

export class VerificationService {
    private readonly tokenLength = 32; // Length of the verification token
    private readonly tokenExpiry = 24; // Token expiry time in hours


    // Generate a verification token

    generateToken(): string {
        return crypto.randomBytes(this.tokenLength).toString('hex');
    }

    // Generate EXPIRY DATE for the token

    generateExpirationDate(): Date {
        const expires = new Date();
        expires.setHours(expires.getHours() + this.tokenExpiry);
        return expires;

    }

    // check if token is expired

    isTokenExpired(expires: Date): boolean {
        return new Date() > expires;
    }
}

export const verificationService = new VerificationService();