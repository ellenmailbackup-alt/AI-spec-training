/**
 * Parameter Service Layer
 *
 * Handles all system parameter-related business logic.
 * System parameters are configuration values stored in the database
 * that control application behavior (e.g., current_year).
 */

import { db } from "./db";
import { parameterTable, type Parameter } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export class ParameterService {
  /**
   * Gets a system parameter by name.
   * Uses case-insensitive comparison to ensure robustness across different data sources.
   *
   * @param parameterName - The name of the parameter to retrieve
   * @returns The parameter value or undefined if not found
   */
  async getParameter(parameterName: string): Promise<string | undefined> {
    const [param] = await db
      .select()
      .from(parameterTable)
      .where(sql`UPPER(${parameterTable.parameterName}) = UPPER(${parameterName})`);

    return param?.parameterValue;
  }

  /**
   * Gets the current year parameter from the system.
   * This is used throughout the application for year-based calculations.
   *
   * @returns The current year as a number
   * @throws Error if current_year parameter is not configured
   */
  async getCurrentYear(): Promise<number> {
    const yearValue = await this.getParameter('current_year');

    if (!yearValue) {
      throw new Error(
        'Current year not configured in system. ' +
        'Please add a "current_year" parameter to the parameter_table.'
      );
    }

    const year = parseInt(yearValue);

    if (isNaN(year) || year < 2000 || year > 2100) {
      throw new Error(
        `Invalid current year value: "${yearValue}". ` +
        'Expected a year between 2000 and 2100.'
      );
    }

    return year;
  }

  /**
   * Sets or updates a system parameter.
   * Uses case-insensitive comparison to ensure robustness.
   *
   * @param parameterName - The name of the parameter
   * @param parameterValue - The value to set
   * @returns The updated parameter record
   */
  async setParameter(parameterName: string, parameterValue: string): Promise<Parameter> {
    // Check if parameter exists (case-insensitive)
    const existing = await db
      .select()
      .from(parameterTable)
      .where(sql`UPPER(${parameterTable.parameterName}) = UPPER(${parameterName})`);

    if (existing.length > 0) {
      // Update existing (use the actual stored name to preserve case)
      const [updated] = await db
        .update(parameterTable)
        .set({ parameterValue })
        .where(sql`UPPER(${parameterTable.parameterName}) = UPPER(${parameterName})`)
        .returning();

      return updated;
    } else {
      // Insert new
      const [created] = await db
        .insert(parameterTable)
        .values({ parameterName, parameterValue })
        .returning();

      return created;
    }
  }

  /**
   * Gets all system parameters.
   *
   * @returns Array of all parameters
   */
  async getAllParameters(): Promise<Parameter[]> {
    return await db
      .select()
      .from(parameterTable)
      .orderBy(parameterTable.parameterName);
  }
}

export const parameterService = new ParameterService();
