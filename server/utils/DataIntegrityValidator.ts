import { agentConfigManager } from '../config/AgentConfigManager';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataSource {
  type: 'api' | 'blockchain' | 'user_input' | 'database';
  source: string;
  verified: boolean;
  timestamp: number;
}

/**
 * Data Integrity Validator ensures all agent responses contain only authentic data
 */
export class DataIntegrityValidator {
  private static instance: DataIntegrityValidator;
  private integrityRules: any;

  private constructor() {
    this.loadIntegrityRules();
  }

  public static getInstance(): DataIntegrityValidator {
    if (!DataIntegrityValidator.instance) {
      DataIntegrityValidator.instance = new DataIntegrityValidator();
    }
    return DataIntegrityValidator.instance;
  }

  private loadIntegrityRules(): void {
    try {
      const config = agentConfigManager.loadConfig();
      this.integrityRules = (config as any).data_integrity_rules;
      console.log('[DataIntegrityValidator] Loaded data integrity rules');
    } catch (error) {
      console.error('[DataIntegrityValidator] Failed to load integrity rules:', error);
      // Fallback to basic rules
      this.integrityRules = {
        strict_authenticity: { enabled: true },
        blockchain_data_integrity: { enabled: true },
        response_validation: { enabled: true },
        error_handling: { enabled: true }
      };
    }
  }

  /**
   * Validate agent response for data authenticity
   */
  public validateResponse(agentName: string, response: any, dataSources: DataSource[] = []): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!this.integrityRules.strict_authenticity.enabled) {
      return result; // Skip validation if disabled
    }

    // Check for prohibited patterns
    this.checkForProhibitedPatterns(response, result);
    
    // Validate blockchain data if present
    this.validateBlockchainData(response, result);
    
    // Validate data sources
    this.validateDataSources(dataSources, result);
    
    // Check for mock/placeholder indicators
    this.checkForMockData(response, result);

    // Log validation results
    if (result.errors.length > 0) {
      console.error(`[DataIntegrityValidator] Validation FAILED for ${agentName}:`, result.errors);
      result.isValid = false;
    } else if (result.warnings.length > 0) {
      console.warn(`[DataIntegrityValidator] Validation warnings for ${agentName}:`, result.warnings);
    } else {
      console.log(`[DataIntegrityValidator] Validation PASSED for ${agentName}`);
    }

    return result;
  }

  /**
   * Check response for prohibited patterns that indicate fake data
   */
  private checkForProhibitedPatterns(response: any, result: ValidationResult): void {
    const responseText = JSON.stringify(response).toLowerCase();
    
    const prohibitedPatterns = [
      /simulated?/i,
      /mock/i,
      /fake/i,
      /placeholder/i,
      /dummy/i,
      /test.*data/i,
      /estimated.*\$[\d,]+/i, // Estimated dollar amounts
      /\$\d+\.\d{2}.*estimated/i,
      /0x0+/i, // Zero addresses
      /example/i,
      /sample/i
    ];

    prohibitedPatterns.forEach(pattern => {
      if (pattern.test(responseText)) {
        result.errors.push(`Response contains prohibited pattern: ${pattern.source}`);
      }
    });
  }

  /**
   * Validate blockchain-specific data authenticity
   */
  private validateBlockchainData(response: any, result: ValidationResult): void {
    const responseText = JSON.stringify(response);

    // Check for wallet addresses
    const addressPattern = /0x[a-fA-F0-9]{40}/g;
    const addresses = responseText.match(addressPattern);
    
    if (addresses) {
      addresses.forEach(address => {
        if (address === '0x0000000000000000000000000000000000000000' || 
            address.match(/0x0+/) ||
            address.includes('...')) {
          result.errors.push(`Invalid or placeholder address detected: ${address}`);
        }
      });
    }

    // Check for suspicious balance patterns
    const balancePatterns = [
      /balance.*[\d,]+\.\d{2}.*estimated/i,
      /\$[\d,]+\.\d{2}.*simulated/i,
      /random.*balance/i
    ];

    balancePatterns.forEach(pattern => {
      if (pattern.test(responseText)) {
        result.errors.push(`Suspicious balance pattern detected: ${pattern.source}`);
      }
    });

    // Check for transaction hashes
    const txHashPattern = /0x[a-fA-F0-9]{64}/g;
    const txHashes = responseText.match(txHashPattern);
    
    if (txHashes) {
      txHashes.forEach(hash => {
        if (hash.match(/0x0+/)) {
          result.warnings.push(`Zero transaction hash detected: ${hash}`);
        }
      });
    }
  }

  /**
   * Validate that data sources are authentic and verified
   */
  private validateDataSources(dataSources: DataSource[], result: ValidationResult): void {
    if (dataSources.length === 0) {
      result.warnings.push('No data sources specified');
      return;
    }

    dataSources.forEach(source => {
      if (!source.verified) {
        result.errors.push(`Unverified data source: ${source.source}`);
      }

      if (source.type === 'api' && !this.isAuthorizedAPI(source.source)) {
        result.errors.push(`Unauthorized API source: ${source.source}`);
      }

      // Check data freshness (within last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      if (source.timestamp < fiveMinutesAgo) {
        result.warnings.push(`Stale data from source: ${source.source}`);
      }
    });
  }

  /**
   * Check for mock data indicators
   */
  private checkForMockData(response: any, result: ValidationResult): void {
    const responseText = JSON.stringify(response);

    // Look for common mock data patterns
    const mockPatterns = [
      /Math\.random/i,
      /\.toFixed\(2\)/i, // Often used in mock calculations
      /random.*\(\)/i,
      /generate.*fake/i,
      /simulate.*transaction/i
    ];

    mockPatterns.forEach(pattern => {
      if (pattern.test(responseText)) {
        result.errors.push(`Mock data pattern detected: ${pattern.source}`);
      }
    });
  }

  /**
   * Check if API source is authorized for authentic data
   */
  private isAuthorizedAPI(source: string): boolean {
    const authorizedAPIs = [
      'basecamp.cloud.blockscout.com',
      'api.coingecko.com',
      'api.etherscan.io',
      'api.polygonscan.com',
      'api.bscscan.com'
    ];

    return authorizedAPIs.some(api => source.includes(api));
  }

  /**
   * Create error response for authentication failures
   */
  public createAuthenticDataErrorResponse(operation: string, reason: string): any {
    const errorResponses = this.integrityRules.error_handling?.error_responses || {};
    
    return {
      success: false,
      error: `Data Integrity Violation: ${operation}`,
      message: reason,
      suggestion: "Please ensure all data comes from authentic sources only.",
      timestamp: new Date().toISOString(),
      code: 'DATA_INTEGRITY_ERROR'
    };
  }

  /**
   * Validate wallet address authenticity
   */
  public validateWalletAddress(address: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!address || address.length !== 42 || !address.startsWith('0x')) {
      result.errors.push('Invalid wallet address format');
      result.isValid = false;
    }

    if (address === '0x0000000000000000000000000000000000000000') {
      result.errors.push('Zero address is not allowed');
      result.isValid = false;
    }

    if (address.match(/0x0+/)) {
      result.errors.push('Placeholder address detected');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate financial amount authenticity
   */
  public validateFinancialAmount(amount: number | string, source: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (typeof amount === 'string' && amount.includes('estimated')) {
      result.errors.push('Estimated amounts are not allowed - use authentic data only');
      result.isValid = false;
    }

    if (!source || !this.isAuthorizedAPI(source)) {
      result.errors.push(`Financial data must come from authorized sources. Current source: ${source}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get integrity rules summary
   */
  public getIntegrityRulesSummary(): any {
    return {
      enabled: this.integrityRules.strict_authenticity.enabled,
      rules: this.integrityRules.strict_authenticity.rules || [],
      blockchain_rules: this.integrityRules.blockchain_data_integrity.rules || [],
      validation_checks: this.integrityRules.response_validation.validation_checks || []
    };
  }
}

// Export singleton instance
export const dataIntegrityValidator = DataIntegrityValidator.getInstance();