// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TempleRunnerNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    uint256 public constant MINT_PRICE = 0.001 ether; // Very low price for accessibility
    uint256 public constant MAX_SUPPLY = 10000;
    
    mapping(uint256 => string) private _characterTypes;
    
    event CharacterMinted(address indexed to, uint256 indexed tokenId, string characterType);
    
    constructor() ERC721("Temple Runner Characters", "TRC") {}
    
    function mintCharacter(string memory characterType) public payable {
        require(msg.value >= MINT_PRICE, "Insufficient payment");
        require(_tokenIds.current() < MAX_SUPPLY, "Max supply reached");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(msg.sender, newTokenId);
        _characterTypes[newTokenId] = characterType;
        
        emit CharacterMinted(msg.sender, newTokenId, characterType);
    }
    
    function getCharacterType(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _characterTypes[tokenId];
    }
    
    function walletOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        return tokenIds;
    }
    
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }
    
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
}