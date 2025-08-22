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
        string role;
        string gender;
        uint8 flirtiness;
        uint8 intelligence;
        uint8 humor;
        uint8 loyalty;
        uint8 empathy;
        string personalityType;
        string appearance;
        string backgroundStory;
        uint256 createdAt;
        uint256 lastModified;
    }

    mapping(uint256 => CompanionTraits) public companionTraits;
    mapping(address => uint256) public ownerToCompanion;
    mapping(uint256 => bool) public isActive;
    
    uint256 public constant MINT_FEE = 0.001 ether;
    
    event CompanionMinted(address indexed owner, uint256 indexed tokenId);
    event TraitsUpdated(uint256 indexed tokenId);

    constructor() ERC721("Companion NFT", "COMP") Ownable(msg.sender) {}

    function mintCompanion() external payable nonReentrant {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(ownerToCompanion[msg.sender] == 0, "Already owns a companion");
        
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        
        _safeMint(msg.sender, tokenId);
        
        // Initialize with default values
        companionTraits[tokenId].createdAt = block.timestamp;
        companionTraits[tokenId].lastModified = block.timestamp;
        
        ownerToCompanion[msg.sender] = tokenId;
        isActive[tokenId] = true;
        
        emit CompanionMinted(msg.sender, tokenId);
    }

    function setBasicInfo(
        uint256 tokenId,
        string calldata name,
        uint8 age,
        string calldata role,
        string calldata gender
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(isActive[tokenId], "Not active");
        
        companionTraits[tokenId].name = name;
        companionTraits[tokenId].age = age;
        companionTraits[tokenId].role = role;
        companionTraits[tokenId].gender = gender;
        companionTraits[tokenId].lastModified = block.timestamp;
        
        emit TraitsUpdated(tokenId);
    }

    function setPersonality(
        uint256 tokenId,
        uint8 flirtiness,
        uint8 intelligence,
        uint8 humor,
        uint8 loyalty,
        uint8 empathy,
        string calldata personalityType
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(isActive[tokenId], "Not active");
        
        companionTraits[tokenId].flirtiness = flirtiness;
        companionTraits[tokenId].intelligence = intelligence;
        companionTraits[tokenId].humor = humor;
        companionTraits[tokenId].loyalty = loyalty;
        companionTraits[tokenId].empathy = empathy;
        companionTraits[tokenId].personalityType = personalityType;
        companionTraits[tokenId].lastModified = block.timestamp;
        
        emit TraitsUpdated(tokenId);
    }

    function setAppearanceAndStory(
        uint256 tokenId,
        string calldata appearance,
        string calldata backgroundStory
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        require(isActive[tokenId], "Not active");
        
        companionTraits[tokenId].appearance = appearance;
        companionTraits[tokenId].backgroundStory = backgroundStory;
        companionTraits[tokenId].lastModified = block.timestamp;
        
        emit TraitsUpdated(tokenId);
    }

    function getCompanionByOwner(address owner) external view returns (uint256, CompanionTraits memory) {
        uint256 tokenId = ownerToCompanion[owner];
        require(tokenId != 0, "No companion found");
        return (tokenId, companionTraits[tokenId]);
    }

    function hasCompanion(address owner) external view returns (bool) {
        return ownerToCompanion[owner] != 0 && isActive[ownerToCompanion[owner]];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        address previousOwner = super._update(to, tokenId, auth);
        
        if (from != address(0)) {
            ownerToCompanion[from] = 0;
        }
        if (to != address(0)) {
            ownerToCompanion[to] = tokenId;
        }
        
        return previousOwner;
    }

    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }
}