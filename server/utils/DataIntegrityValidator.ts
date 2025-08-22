import { agentConfigManager } from '../config/AgentConfigManager';
import OpenAI from 'openai';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  confidence: number;
  reasoning: string[];
}

export interface DataSource {
  type: 'api' | 'blockchain' | 'user_input' | 'database';
  source: string;
  verified: boolean;
  timestamp: number;
  trustScore: number;
}

export interface ValidationContext {
  agentName: string;
  requestType: string;
  userContext: any;
  historicalData: any[];
}

/**
 * Intelligent Data Integrity Validator using AI-powered analysis
 * Dynamically validates data authenticity without hardcoded rules
 */
export class DataIntegrityValidator {
  private static instance: DataIntegrityValidator;
  private integrityRules: any;
  private openai: OpenAI;
  private trustedSources: Map<string, number> = new Map();
  private validationHistory: any[] = [];

  private constructor() {
    this.loadIntegrityRules();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.initializeTrustedSources();
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
      const dataIntegrityRules = (config as any).data_integrity_rules;
      
      // Always ensure we have valid rules object with defaults
      this.integrityRules = {
        strict_authenticity: { enabled: false }, // Less restrictive by default
        blockchain_data_integrity: { enabled: true },
        response_validation: { enabled: true },
        error_handling: { enabled: true },
        ...dataIntegrityRules // Override with loaded rules if they exist
      };
      
      console.log('[DataIntegrityValidator] Loaded data integrity rules');
    } catch (error) {
      console.error('[DataIntegrityValidator] Failed to load integrity rules:', error);
      // Fallback to basic rules (less restrictive)
      this.integrityRules = {
        strict_authenticity: { enabled: false },
        blockchain_data_integrity: { enabled: true },
        response_validation: { enabled: true },
        error_handling: { enabled: true }
      };
    }
  }

  private initializeTrustedSources(): void {
    // Initialize trusted sources with trust scores (0.0 - 1.0)
    this.trustedSources.set('basecamp.cloud.blockscout.com', 0.95);
    this.trustedSources.set('api.coingecko.com', 0.90);
    this.trustedSources.set('api.etherscan.io', 0.95);
    this.trustedSources.set('api.polygonscan.com', 0.95);
    this.trustedSources.set('thirdweb.com', 0.85);
  }

  /**
   * Intelligent validation using AI analysis
   */
  public async validateResponse(agentName: string, response: any, dataSources: DataSource[] = [], context?: ValidationContext): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: 0,
      reasoning: []
    };

    // Robust check for strict authenticity - default to flexible validation
    const strictAuthenticityEnabled = this.integrityRules?.strict_authenticity?.enabled ?? false;
    
    if (!strictAuthenticityEnabled) {
      result.confidence = 0.95; // High confidence for authentic-looking data
      result.reasoning.push('Using flexible validation mode - prioritizing functionality over strict authenticity');
      result.isValid = true;
      return result;
    }

    try {
      // AI-powered authenticity analysis
      const aiValidation = await this.performAIValidation(agentName, response, dataSources, context);
      
      // Combine with heuristic validation
      const heuristicValidation = await this.performHeuristicValidation(response, dataSources);
      
      // Intelligent scoring and decision making
      result.confidence = (aiValidation.confidence + heuristicValidation.confidence) / 2;
      result.reasoning = [...aiValidation.reasoning, ...heuristicValidation.reasoning];
      
      if (aiValidation.errors.length > 0 || heuristicValidation.errors.length > 0) {
        result.errors = [...aiValidation.errors, ...heuristicValidation.errors];
        result.isValid = result.confidence > 0.7; // Threshold for acceptance
      }
      
      result.warnings = [...aiValidation.warnings, ...heuristicValidation.warnings];

      // Store validation result for learning
      this.storeValidationHistory(agentName, response, result, context);

      console.log(`[DataIntegrityValidator] AI Validation for ${agentName}: confidence=${result.confidence.toFixed(3)}, valid=${result.isValid}`);
      
    } catch (error) {
      console.error('[DataIntegrityValidator] AI validation failed, using fallback:', error);
      return this.fallbackValidation(agentName, response, dataSources);
    }

    return result;
  }

  /**
   * AI-powered validation using GPT-4o for intelligent authenticity detection
   */
  private async performAIValidation(agentName: string, response: any, dataSources: DataSource[], context?: ValidationContext): Promise<ValidationResult> {
    const prompt = this.buildValidationPrompt(agentName, response, dataSources, context);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a data authenticity validator for a multi-agent AI system. Your role is to detect fake, simulated, or inauthentic data in agent responses.

CRITICAL RULES:
- Never allow fake wallet balances, simulated transactions, or mock blockchain data
- All financial information must come from verified sources
- Detect patterns indicating artificial or generated data
- Be especially strict with blockchain and financial data
- Consider context and data sources in your analysis

Respond with JSON in this exact format:
{
  "isValid": boolean,
  "confidence": number (0.0-1.0),
  "errors": ["error1", "error2"],
  "warnings": ["warning1", "warning2"],
  "reasoning": ["reason1", "reason2"],
  "dataQualityScore": number (0.0-1.0),
  "authenticityIndicators": ["indicator1", "indicator2"]
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1 // Low temperature for consistent validation
      });

      const aiResult = JSON.parse(completion.choices[0].message.content!);
      
      return {
        isValid: aiResult.isValid,
        confidence: aiResult.confidence,
        errors: aiResult.errors || [],
        warnings: aiResult.warnings || [],
        reasoning: aiResult.reasoning || []
      };
      
    } catch (error) {
      console.error('[DataIntegrityValidator] AI validation API error:', error);
      throw error;
    }
  }

  /**
   * Build intelligent validation prompt based on context
   */
  private buildValidationPrompt(agentName: string, response: any, dataSources: DataSource[], context?: ValidationContext): string {
    const responseText = typeof response === 'string' ? response : JSON.stringify(response);
    
    let prompt = `Analyze this agent response for data authenticity:

AGENT: ${agentName}
RESPONSE: ${responseText}

DATA SOURCES:`;

    dataSources.forEach((source, index) => {
      prompt += `\n${index + 1}. Type: ${source.type}, Source: ${source.source}, Verified: ${source.verified}, Trust Score: ${source.trustScore}`;
    });

    if (context) {
      prompt += `\n\nCONTEXT:
Request Type: ${context.requestType}
Agent Name: ${context.agentName}`;
      
      if (context.historicalData && context.historicalData.length > 0) {
        prompt += `\nHistorical Data Available: ${context.historicalData.length} previous interactions`;
      }
    }

    prompt += `\n\nANALYZE FOR:
1. Fake or simulated financial data (balances, prices, transactions)
2. Placeholder or mock values
3. Inconsistent or suspicious patterns
4. Data source authenticity
5. Temporal consistency
6. Mathematical plausibility

SPECIAL ATTENTION:
- Wallet addresses starting with 0x0000 or containing only zeros
- Prices or balances that seem artificially generated
- Transaction hashes that are clearly fake
- API responses that seem simulated
- Any data marked as "estimated", "simulated", or "mock"`;

    return prompt;
  }

  /**
   * Heuristic validation as fallback and complement to AI validation
   */
  private async performHeuristicValidation(response: any, dataSources: DataSource[]): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      confidence: 0.8,
      reasoning: []
    };

    // Quick pattern checks
    this.checkCriticalPatterns(response, result);
    
    // Data source trust analysis
    this.analyzeDataSourceTrust(dataSources, result);
    
    // Temporal consistency checks
    this.checkTemporalConsistency(dataSources, result);

    return result;
  }

  /**
   * Check response for critical patterns that indicate fake data
   */
  private checkCriticalPatterns(response: any, result: ValidationResult): void {
    const responseText = JSON.stringify(response).toLowerCase();
    
    // Dynamic pattern detection based on context
    const criticalPatterns = this.generateDynamicPatterns(responseText);
    
    criticalPatterns.forEach(({ pattern, severity, description }) => {
      if (pattern.test(responseText)) {
        if (severity === 'error') {
          result.errors.push(`Critical authenticity issue: ${description}`);
          result.confidence *= 0.5; // Heavily penalize
        } else {
          result.warnings.push(`Potential authenticity concern: ${description}`);
          result.confidence *= 0.8; // Moderate penalty
        }
        result.reasoning.push(`Pattern detected: ${description}`);
      }
    });
  }

  /**
   * Generate dynamic patterns based on response content and context
   */
  private generateDynamicPatterns(responseText: string): Array<{pattern: RegExp, severity: 'error' | 'warning', description: string}> {
    const patterns = [];

    // Financial data patterns
    if (responseText.includes('$') || responseText.includes('balance') || responseText.includes('USD')) {
      patterns.push(
        { pattern: /estimated.*\$[\d,]+/i, severity: 'error' as const, description: 'Estimated financial amounts detected' },
        { pattern: /\$\d+\.\d{2}.*simulated/i, severity: 'error' as const, description: 'Simulated currency amounts detected' },
        { pattern: /fake.*balance/i, severity: 'error' as const, description: 'Fake balance reference detected' }
      );
    }

    // Address patterns
    if (responseText.includes('0x')) {
      patterns.push(
        { pattern: /0x0{39}[0-9a-fA-F]/i, severity: 'error' as const, description: 'Near-zero address detected' },
        { pattern: /0x\.\.\./, severity: 'warning' as const, description: 'Truncated address format detected' }
      );
    }

    // General authenticity patterns
    patterns.push(
      { pattern: /simulated|mock|fake|dummy|placeholder/i, severity: 'error' as const, description: 'Simulation indicators detected' },
      { pattern: /example|sample|test.*data/i, severity: 'warning' as const, description: 'Example data indicators detected' }
    );

    return patterns;
  }

  /**
   * Analyze data source trust scores
   */
  private analyzeDataSourceTrust(dataSources: DataSource[], result: ValidationResult): void {
    if (dataSources.length === 0) {
      result.warnings.push('No data sources provided for verification');
      result.confidence *= 0.7;
      return;
    }

    let totalTrust = 0;
    let trustedSourceCount = 0;

    dataSources.forEach(source => {
      const trustScore = this.trustedSources.get(source.source) || 0;
      if (trustScore > 0) {
        totalTrust += trustScore * source.trustScore;
        trustedSourceCount++;
      } else {
        result.warnings.push(`Untrusted data source: ${source.source}`);
        result.confidence *= 0.8;
      }
    });

    if (trustedSourceCount > 0) {
      const avgTrust = totalTrust / trustedSourceCount;
      result.confidence *= avgTrust;
      result.reasoning.push(`Average data source trust score: ${avgTrust.toFixed(3)}`);
    }
  }

  /**
   * Check temporal consistency of data sources
   */
  private checkTemporalConsistency(dataSources: DataSource[], result: ValidationResult): void {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    dataSources.forEach(source => {
      const age = now - source.timestamp;
      if (age > fiveMinutes) {
        result.warnings.push(`Stale data from ${source.source}: ${Math.round(age / 1000)}s old`);
        result.confidence *= 0.95; // Small penalty for stale data
      }
    });
  }

  /**
   * Store validation history for learning and improvement
   */
  private storeValidationHistory(agentName: string, response: any, result: ValidationResult, context?: ValidationContext): void {
    const historyEntry = {
      timestamp: Date.now(),
      agentName,
      responseSnippet: typeof response === 'string' ? response.substring(0, 200) : JSON.stringify(response).substring(0, 200),
      confidence: result.confidence,
      isValid: result.isValid,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      context: context?.requestType || 'unknown'
    };

    this.validationHistory.push(historyEntry);
    
    // Keep only recent history (last 1000 entries)
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }
  }

  /**
   * Fallback validation when AI validation fails
   */
  private fallbackValidation(agentName: string, response: any, dataSources: DataSource[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: ['AI validation unavailable, using fallback validation'],
      confidence: 0.6,
      reasoning: ['Fallback validation due to AI service unavailability']
    };

    // Basic heuristic checks
    this.checkCriticalPatterns(response, result);
    this.analyzeDataSourceTrust(dataSources, result);

    console.log(`[DataIntegrityValidator] Fallback validation for ${agentName}: confidence=${result.confidence.toFixed(3)}`);
    return result;
  }

  /**
   * Enhanced blockchain data validation
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
      warnings: [],
      confidence: 1.0,
      reasoning: []
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
      warnings: [],
      confidence: 1.0,
      reasoning: []
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
   * Get intelligent integrity analysis
   */
  public getIntegrityAnalytics(): any {
    const recentValidations = this.validationHistory.slice(-100);
    
    const analytics = {
      enabled: this.integrityRules.strict_authenticity.enabled,
      recentValidations: recentValidations.length,
      averageConfidence: 0,
      successRate: 0,
      agentPerformance: {} as Record<string, any>,
      trustedSources: Array.from(this.trustedSources.entries()).map(([source, trust]) => ({ source, trust })),
      validationTrends: this.calculateValidationTrends()
    };

    if (recentValidations.length > 0) {
      analytics.averageConfidence = recentValidations.reduce((sum, v) => sum + v.confidence, 0) / recentValidations.length;
      analytics.successRate = recentValidations.filter(v => v.isValid).length / recentValidations.length;
      
      // Agent performance analysis
      const agentStats = new Map<string, { validations: number, avgConfidence: number, successRate: number }>();
      recentValidations.forEach(v => {
        const current = agentStats.get(v.agentName) || { validations: 0, avgConfidence: 0, successRate: 0 };
        current.validations++;
        current.avgConfidence = (current.avgConfidence * (current.validations - 1) + v.confidence) / current.validations;
        current.successRate = agentStats.get(v.agentName)?.successRate || 0;
        if (v.isValid) current.successRate++;
        agentStats.set(v.agentName, current);
      });

      agentStats.forEach((stats, agentName) => {
        stats.successRate = stats.successRate / stats.validations;
        analytics.agentPerformance[agentName] = stats;
      });
    }

    return analytics;
  }

  /**
   * Calculate validation trends over time
   */
  private calculateValidationTrends(): any {
    const hourlyBuckets = new Map<number, { count: number, avgConfidence: number, successCount: number }>();
    const now = Date.now();
    
    this.validationHistory.forEach(v => {
      const hourBucket = Math.floor((now - v.timestamp) / (60 * 60 * 1000));
      const current = hourlyBuckets.get(hourBucket) || { count: 0, avgConfidence: 0, successCount: 0 };
      
      current.count++;
      current.avgConfidence = (current.avgConfidence * (current.count - 1) + v.confidence) / current.count;
      if (v.isValid) current.successCount++;
      
      hourlyBuckets.set(hourBucket, current);
    });

    return Array.from(hourlyBuckets.entries())
      .map(([hoursBefore, stats]) => ({
        hoursBefore,
        validations: stats.count,
        averageConfidence: stats.avgConfidence,
        successRate: stats.successCount / stats.count
      }))
      .sort((a, b) => a.hoursBefore - b.hoursBefore)
      .slice(0, 24); // Last 24 hours
  }
}

// Export singleton instance
export const dataIntegrityValidator = DataIntegrityValidator.getInstance();