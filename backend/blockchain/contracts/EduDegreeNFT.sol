// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EduDegreeNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    event DegreeMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor() ERC721("EduDegree NFT", "EDUDEGREE") Ownable(msg.sender) {}

    function mintDegree(address to, string memory tokenURI)
        external
        onlyOwner
        returns (uint256)
    {
        require(to != address(0), "invalid to");
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        emit DegreeMinted(to, tokenId, tokenURI);
        return tokenId;
    }

    function nextTokenId() external view returns (uint256) {
        return _tokenIdCounter + 1;
    }
}
