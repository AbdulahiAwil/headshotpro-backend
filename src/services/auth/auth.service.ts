import { IUser, User, UserRole } from "@/model/User.model";
import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  UnAuthorizedError,
  ValidationError,
} from "@/util/error";
import { registerInput } from "@/validator/auth.validator";
import { passwordService } from "./password.service";
import { verificationService } from "./verificition.service";
import { emailService } from "../notification/email.service";
import { logger } from "@/util/logger";
import { TokenPayload, tokenService } from "./token.service";

export class AuthService {
  async registerUser(input: registerInput): Promise<{ user: IUser }> {
    // normalize email to lowercase

    const normalizedEmail = this.normalizeEmail(input.email);

    // Check if user with the same email already exists

    await this.checkUserExists(normalizedEmail);

    // Hash password (implementation not shown here)

    const hashedPassword = await passwordService.hashPassword(input.password);

    // Generate varification token (implementation not shown here)

    const verificationToken = verificationService.generateToken();

    const verificationTokenExpires =
      verificationService.generateExpirationDate();

    // Create new user

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: input.name,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationTokenExpires,
      isEmailVerified: false,
      role: UserRole.USER,
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(
        normalizedEmail,
        input.name,
        verificationToken
      );
    } catch (error) {
      logger.error("Error sending verification email", error);
      throw new ExternalServiceError(
        "Email Service",
        "Failed to send verification email"
      );
    }

    return { user };
  }

  // Verify email

  async verifyEmail(token: string): Promise<void> {
    // Find user by verification token
    console.log("Verifying email with token:", token);

    const user = await User.findOne({ emailVerificationToken: token }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      throw new ValidationError("Invalid or verification token");
    }
    // Check if token is expired

    if (
      !user.emailVerificationExpires ||
      new Date() > user.emailVerificationExpires
    ) {
      throw new ValidationError("Verification token has expired");
    }

    // check if email is already verified

    if (user.isEmailVerified) {
      throw new ValidationError("Email is already verified");
    }

    // verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();
  }

  // Resend verification email

  async resendVerificationEmail(email: string): Promise<void> {
    const normalizedEmail = this.normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.isEmailVerified) {
      throw new ConflictError("Email is already verified");
    }

    // generate new verification token
    const verificationToken = verificationService.generateToken();
    const verificationTokenExpires =
      verificationService.generateExpirationDate();

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationTokenExpires;

    await user.save();

    await emailService.sendVerificationEmail(
      normalizedEmail,
      user.name,
      verificationToken
    );
  }


   async login(
    email: string,
    password: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // normalize email to lowercase
    const normalizedEmail = this.normalizeEmail(email);
    // find user by email
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user) {
      throw new UnAuthorizedError("Invalid email or password");
    }

    // is Active

    if (!user.isActive) {
      throw new UnAuthorizedError(
        "Your account has been deactivated. Please contact support."
      );
    }

    // is Email Verified

    if (!user.isEmailVerified) {
      throw new UnAuthorizedError("Please verify your email to login.");
    }

    // compare password

    const isPasswordValid = await passwordService.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new UnAuthorizedError("Invalid email or password");
    }

    // generate access token

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: normalizedEmail,
      role: user.role,
    };

    const { accessToken, refreshToken } =
      tokenService.generateTokenPair(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save();

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  //Refresh token service

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // verify refresh token

    const payload = tokenService.verifyRefreshToken(refreshToken);

    // find user by id

    const user = await User.findById(payload.userId).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnAuthorizedError("Invalid refresh token");
    }

    // is Active
    if (!user.isActive) {
      throw new UnAuthorizedError(
        "Your account has been deactivated. Please contact support."
      );
    }
    
    // Generate new access token

    const newPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const tokens = tokenService.generateTokenPair(newPayload);

    user.refreshToken = tokens.refreshToken;
    await user.save();

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  

  

  private async checkUserExists(email: string): Promise<void> {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ConflictError(`User with this email already exists ${email}`);
    }
  }

   async logout(userId: string): Promise<void> {
    // refresh token
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }


  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
}

export const authService = new AuthService(); // Exporting an instance for use in controllers
