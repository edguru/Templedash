// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CompanionNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter = 1;

    struct CompanionData {
        uint8 age;
        uint8 flirtiness;
        uint8 intelligence; 
        uint8 humor;
        uint8 loyalty;
        uint8 empathy;
        uint256 createdAt;
    }

    mapping(uint256 => CompanionData) public companions;
    mapping(uint256 => string) public names;
    mapping(uint256 => string) public roles;
    mapping(uint256 => string) public genders;
    mapping(uint256 => string) public personalities;
    mapping(uint256 => string) public appearances;
    mapping(uint256 => string) public stories;
    mapping(address => uint256) public ownerToCompanion;
    
    uint256 public constant MINT_FEE = 0.001 ether;
    
    event CompanionMinted(address indexed owner, uint256 indexed tokenId);

    constructor() ERC721("Companion NFT", "COMP") Ownable(msg.sender) {}

    function mint() external payable {
        require(msg.value >= MINT_FEE, "Insufficient fee");
        require(ownerToCompanion[msg.sender] == 0, "Already owns companion");
        
        uint256 tokenId = _tokenIdCounter++;
        _mint(msg.sender, tokenId);
        
        companions[tokenId].createdAt = block.timestamp;
        ownerToCompanion[msg.sender] = tokenId;
        
        emit CompanionMinted(msg.sender, tokenId);
    }

    function setName(uint256 tokenId, string calldata name) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        names[tokenId] = name;
    }

    function setRole(uint256 tokenId, string calldata role) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        roles[tokenId] = role;
    }

    function setGender(uint256 tokenId, string calldata gender) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        genders[tokenId] = gender;
    }

    function setPersonality(uint256 tokenId, string calldata personality) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        personalities[tokenId] = personality;
    }

    function setAppearance(uint256 tokenId, string calldata appearance) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        appearances[tokenId] = appearance;
    }

    function setStory(uint256 tokenId, string calldata story) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        stories[tokenId] = story;
    }

    function setTraits(
        uint256 tokenId,
        uint8 age,
        uint8 flirtiness,
        uint8 intelligence,
        uint8 humor,
        uint8 loyalty,
        uint8 empathy
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        
        CompanionData storage data = companions[tokenId];
        data.age = age;
        data.flirtiness = flirtiness;
        data.intelligence = intelligence;
        data.humor = humor;
        data.loyalty = loyalty;
        data.empathy = empathy;
    }

    function hasCompanion(address owner) external view returns (bool) {
        return ownerToCompanion[owner] != 0;
    }

    function getCompanionId(address owner) external view returns (uint256) {
        return ownerToCompanion[owner];
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

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}