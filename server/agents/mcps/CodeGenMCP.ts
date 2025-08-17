// Code Generation MCP Agent - Generates smart contracts and scripts
import { BaseAgent } from '../core/BaseAgent';
import { MessageBroker } from '../core/MessageBroker';
import { AgentMessage } from '../types/AgentTypes';
import { v4 as uuidv4 } from 'uuid';

interface CodeTemplate {
  type: string;
  template: string;
  parameters: string[];
  dependencies: string[];
}

export class CodeGenMCP extends BaseAgent {
  private templates: Map<string, CodeTemplate> = new Map();

  constructor(messageBroker: MessageBroker) {
    super('codegen-mcp', messageBroker);
  }

  protected initialize(): void {
    this.logActivity('Initializing Code Generation MCP');
    this.loadContractTemplates();
    
    // Subscribe to code generation requests
    this.messageBroker.subscribe('execute_task', async (message: AgentMessage) => {
      if (message.payload.category === 'code_generation') {
        await this.handleMessage(message);
      }
    });
  }

  getCapabilities(): string[] {
    return [
      'smart_contract_generation',
      'erc20_contracts',
      'erc721_contracts', 
      'erc1155_contracts',
      'contract_compilation',
      'security_analysis',
      'deployment_scripts',
      'test_generation'
    ];
  }

  async handleMessage(message: AgentMessage): Promise<AgentMessage | null> {
    try {
      this.logActivity('Handling code generation request', { type: message.type });

      if (message.type === 'execute_task') {
        return await this.generateCode(message);
      }

      return null;
    } catch (error) {
      console.error('[CodeGenMCP] Error handling message:', error);
      return this.createErrorResponse(message, `Code generation failed: ${error}`);
    }
  }

  private async generateCode(message: AgentMessage): Promise<AgentMessage> {
    const { taskId, parameters } = message.payload;
    const { contractType, name, symbol, maxSupply } = parameters;
    
    this.logActivity('Generating smart contract', { contractType, name });

    try {
      let generatedCode: any;

      switch (contractType?.toLowerCase()) {
        case 'erc20':
          generatedCode = await this.generateERC20Contract(parameters);
          break;
        case 'erc721':
          generatedCode = await this.generateERC721Contract(parameters);
          break;
        case 'erc1155':
          generatedCode = await this.generateERC1155Contract(parameters);
          break;
        default:
          throw new Error(`Unsupported contract type: ${contractType}`);
      }

      // Compile and validate
      const compilationResult = await this.compileContract(generatedCode);
      const securityAnalysis = await this.analyzeContractSecurity(generatedCode);

      const result = {
        ...generatedCode,
        compilation: compilationResult,
        security: securityAnalysis,
        deploymentReady: compilationResult.success && securityAnalysis.safe
      };

      return {
        type: 'task_step_complete',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'task-orchestrator',
        payload: {
          taskId,
          success: true,
          result
        }
      };

    } catch (error) {
      return {
        type: 'task_step_complete',
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        senderId: this.agentId,
        targetId: 'task-orchestrator',
        payload: {
          taskId,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private async generateERC20Contract(parameters: Record<string, any>): Promise<any> {
    const { name, symbol, totalSupply = 1000000, decimals = 18 } = parameters;

    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s/g, '')} is ERC20, Ownable {
    constructor() ERC20("${name}", "${symbol}") Ownable(msg.sender) {
        _mint(msg.sender, ${totalSupply} * 10**${decimals});
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}`;

    return {
      contractType: 'ERC20',
      name,
      symbol,
      code: contractCode,
      parameters: { totalSupply, decimals },
      compiler: '0.8.19',
      dependencies: ['@openzeppelin/contracts'],
      gasEstimate: 800000
    };
  }

  private async generateERC721Contract(parameters: Record<string, any>): Promise<any> {
    const { name, symbol, baseURI = '', maxSupply = 10000 } = parameters;

    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ${name.replace(/\s/g, '')} is ERC721, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    uint256 public maxSupply = ${maxSupply};
    string private _baseTokenURI = "${baseURI}";
    
    constructor() ERC721("${name}", "${symbol}") Ownable(msg.sender) {}
    
    function mint(address to) public onlyOwner {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }
    
    function batchMint(address to, uint256 quantity) public onlyOwner {
        require(_tokenIdCounter.current() + quantity <= maxSupply, "Max supply exceeded");
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(to, tokenId);
        }
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }
}`;

    return {
      contractType: 'ERC721',
      name,
      symbol,
      code: contractCode,
      parameters: { baseURI, maxSupply },
      compiler: '0.8.19',
      dependencies: ['@openzeppelin/contracts'],
      gasEstimate: 1200000
    };
  }

  private async generateERC1155Contract(parameters: Record<string, any>): Promise<any> {
    const { name, baseURI = '' } = parameters;

    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ${name.replace(/\s/g, '')} is ERC1155, Ownable {
    string public name = "${name}";
    
    constructor() ERC1155("${baseURI}") Ownable(msg.sender) {}
    
    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public onlyOwner {
        _mint(to, id, amount, data);
    }
    
    function batchMint(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public onlyOwner {
        _mintBatch(to, ids, amounts, data);
    }
    
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }
}`;

    return {
      contractType: 'ERC1155',
      name,
      code: contractCode,
      parameters: { baseURI },
      compiler: '0.8.19',
      dependencies: ['@openzeppelin/contracts'],
      gasEstimate: 1000000
    };
  }

  private async compileContract(contractData: any): Promise<any> {
    // Simulate contract compilation
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock compilation result
    return {
      success: true,
      bytecode: `0x${Array.from({ length: 200 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      abi: this.generateMockABI(contractData.contractType),
      warnings: [],
      gasEstimate: contractData.gasEstimate
    };
  }

  private async analyzeContractSecurity(contractData: any): Promise<any> {
    // Simulate security analysis
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      safe: true,
      issues: [],
      recommendations: [
        'Consider adding pausable functionality for emergency stops',
        'Implement proper access controls for sensitive functions',
        'Add events for important state changes'
      ],
      score: 8.5
    };
  }

  private generateMockABI(contractType: string): any[] {
    const baseABI = [
      {
        "inputs": [],
        "name": "name",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol", 
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    switch (contractType) {
      case 'ERC20':
        return [
          ...baseABI,
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          },
          {
            "inputs": [
              {"internalType": "address", "name": "to", "type": "address"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"}
            ],
            "name": "transfer",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ];

      case 'ERC721':
        return [
          ...baseABI,
          {
            "inputs": [{"internalType": "address", "name": "to", "type": "address"}],
            "name": "mint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          },
          {
            "inputs": [],
            "name": "totalSupply",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
          }
        ];

      case 'ERC1155':
        return [
          ...baseABI,
          {
            "inputs": [
              {"internalType": "address", "name": "to", "type": "address"},
              {"internalType": "uint256", "name": "id", "type": "uint256"},
              {"internalType": "uint256", "name": "amount", "type": "uint256"},
              {"internalType": "bytes", "name": "data", "type": "bytes"}
            ],
            "name": "mint",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ];

      default:
        return baseABI;
    }
  }

  private loadContractTemplates(): void {
    // Load predefined contract templates
    this.templates.set('erc20-basic', {
      type: 'ERC20',
      template: 'basic_erc20_template',
      parameters: ['name', 'symbol', 'totalSupply', 'decimals'],
      dependencies: ['@openzeppelin/contracts']
    });

    this.templates.set('erc721-basic', {
      type: 'ERC721',
      template: 'basic_erc721_template', 
      parameters: ['name', 'symbol', 'baseURI', 'maxSupply'],
      dependencies: ['@openzeppelin/contracts']
    });

    this.templates.set('erc1155-basic', {
      type: 'ERC1155',
      template: 'basic_erc1155_template',
      parameters: ['name', 'baseURI'],
      dependencies: ['@openzeppelin/contracts']
    });
  }

  private createErrorResponse(originalMessage: AgentMessage, error: string): AgentMessage {
    return {
      type: 'error_response',
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      senderId: this.agentId,
      targetId: originalMessage.senderId,
      payload: {
        error,
        originalMessageId: originalMessage.id
      }
    };
  }
}