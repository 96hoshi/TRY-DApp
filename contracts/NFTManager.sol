// contracts/NFTManager.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";


contract NFTManager is ERC721URIStorage  {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint private constant MAX_CLASS = 8;
    address private owner;

    // collection of different images. To visualize the images on the dapp 
    // standard links were used
    string [MAX_CLASS] private classURI = [
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/1prize.jpg",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/2prize.jpg",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/3prize.jpg",
        "https://github.com/96hoshi/TRY-DApp/blob/main/img/4prize.webp?raw=true",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/5prize.png",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/6prize.jpg",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/7prize.jpg",
        "https://raw.githubusercontent.com/96hoshi/TRY-DApp/main/img/8prize.jpg"
    ];

    constructor() ERC721("NFTManager", "ITM") {
        owner = msg.sender;
    }

    function awardItem(uint class) public returns (uint256) {
        require(class > 0 && class < MAX_CLASS + 1);
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(owner, newItemId);
        _setTokenURI(newItemId, classURI[class-1]);

        return newItemId;
    }

    function transferOwn(address to, uint256 tokenId) public {
        require(msg.sender == owner, "Only the owner can transfer ownership.");
        safeTransferFrom(owner, to, tokenId);
    }

    function getTokenURI(uint256 tokenId) public view returns (string memory){
        require(tokenId > 0 && tokenId <= _tokenIds.current());
        return tokenURI(tokenId);
    }
}
