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

    // symbolic collection of different images, for semplicity copies of the same image were used
    string [MAX_CLASS] private classURI = [
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg",
        "https://ipfs.io/ipfs/QmRgHmTNXgaSMM6mu9zNiSAvERzkwAdMyrWJNgudRUiJ7U?filename=class1.jpg"
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
}
