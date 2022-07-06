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
        "https://is1-ssl.mzstatic.com/image/thumb/Purple4/v4/dd/8d/37/dd8d3749-86b8-995f-2516-c4d032bddeb3/source/256x256bb.jpg",
        "https://is3-ssl.mzstatic.com/image/thumb/Purple4/v4/9c/a7/22/9ca72215-42d2-75f3-1055-4a8f7ff62c4e/source/256x256bb.jpg",
        "https://is1-ssl.mzstatic.com/image/thumb/Purple22/v4/9d/17/a2/9d17a2b8-990c-31d7-d442-d72531dae19e/source/256x256bb.jpg",
        "https://play-lh.googleusercontent.com/fDL20r8lkjfNJgMgvHCQLvtHCFJ-H9Y4HN6nCTWfC4hsfGvTAawxqtHwABeJrdSXG7Zi=s256-rw",
        "https://www.freeiconspng.com/thumbs/hello-kitty-png-icon/hello-kitty-icon-7.png",
        "https://idigitalcitizen.files.wordpress.com/2009/07/pinkhellokitty.jpg",
        "https://img.pixers.pics/pho(s3:700/PI/23/27/700_PI2327_65c65c262917a837fe5b7240420e1ab4_5b7ab916358ae_.,700,700,jpg)/poster-hello-kitty.jpg.jpg",
        "https://p1.hiclipart.com/preview/670/83/741/sticker-bomb-white-and-pink-hello-kitty-png-clipart.jpg"
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
