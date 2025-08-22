// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CompanionNFT is ERC721, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct CompanionTraits {
        string name;
        uint8 age;
        string role; // partner, friend, pet
        string gender; // male, female, non-binary
        uint8 flirtiness; // 0-100
        uint8 intelligence; // 0-100
        uint8 humor; // 0-100
        uint8 loyalty; // 0-100
        uint8 empathy; // 0-100
        string personalityType; // helpful, casual, professional
        string appearance; // description or IPFS hash
        string backgroundStory; // optional personal backstory
        uint256 createdAt;
        uint256 lastModified;
    }

    mapping(uint256 => CompanionTraits) public companionTraits;
    mapping(address => uint256) public ownerToCompanion;
    mapping(uint256 => bool) public isActive;
    
    uint256 public constant MINT_FEE = 0.001 ether; // 0.001 CAMP
    
    event CompanionMinted(address indexed owner, uint256 indexed tokenId, string name);
    event TraitsUpdated(uint256 indexed tokenId, address indexed owner);
    event CompanionActivated(uint256 indexed tokenId, address indexed owner);

    constructor() ERC721("Companion NFT", "COMP") Ownable(msg.sender) {}

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the token owner");
        _;
    }

    function mintCompanion(
        string memory name,
        uint8 age,
        string memory role,
        string memory gender,
        uint8 flirtiness,
        uint8 intelligence,
        uint8 humor,
        uint8 loyalty,
        uint8 empathy,
        string memory personalityType,
        string memory appearance,
        string memory backgroundStory
    ) external payable nonReentrant {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(ownerToCompanion[msg.sender] == 0, "Already owns a companion");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(age >= 18 && age <= 100, "Age must be between 18-100");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _safeMint(msg.sender, tokenId);
        
        companionTraits[tokenId] = CompanionTraits({
            name: name,
            age: age,
            role: role,
            gender: gender,
            flirtiness: flirtiness,
            intelligence: intelligence,
            humor: humor,
            loyalty: loyalty,
            empathy: empathy,
            personalityType: personalityType,
            appearance: appearance,
            backgroundStory: backgroundStory,
            createdAt: block.timestamp,
            lastModified: block.timestamp
        });
        
        ownerToCompanion[msg.sender] = tokenId;
        isActive[tokenId] = true;
        
        emit CompanionMinted(msg.sender, tokenId, name);
    }

    function updateTraits(
        uint256 tokenId,
        string memory name,
        uint8 age,
        string memory role,
        string memory gender,
        uint8 flirtiness,
        uint8 intelligence,
        uint8 humor,
        uint8 loyalty,
        uint8 empathy,
        string memory personalityType,
        string memory appearance
    ) external onlyTokenOwner(tokenId) {
        require(isActive[tokenId], "Companion is not active");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(age >= 18 && age <= 100, "Age must be between 18-100");
        
        CompanionTraits storage traits = companionTraits[tokenId];
        traits.name = name;
        traits.age = age;
        traits.role = role;
        traits.gender = gender;
        traits.flirtiness = flirtiness;
        traits.intelligence = intelligence;
        traits.humor = humor;
        traits.loyalty = loyalty;
        traits.empathy = empathy;
        traits.personalityType = personalityType;
        traits.appearance = appearance;
        traits.lastModified = block.timestamp;
        
        emit TraitsUpdated(tokenId, msg.sender);
    }

    function getCompanionByOwner(address owner) external view returns (uint256, CompanionTraits memory) {
        uint256 tokenId = ownerToCompanion[owner];
        require(tokenId != 0, "No companion found");
        return (tokenId, companionTraits[tokenId]);
    }

    function hasCompanion(address owner) external view returns (bool) {
        return ownerToCompanion[owner] != 0 && isActive[ownerToCompanion[owner]];
    }

    // Override transfer to update ownership mapping
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        address previousOwner = super._update(to, tokenId, auth);
        
        // Update ownership mapping on transfer
        if (from != address(0)) {
            ownerToCompanion[from] = 0; // Remove from previous owner
        }
        if (to != address(0)) {
            ownerToCompanion[to] = tokenId; // Assign to new owner
        }
        
        return previousOwner;
    }

    // Owner functions
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
    }

    function setMintFee(uint256 newFee) external onlyOwner {
        // Could implement dynamic fee setting if needed
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }
}